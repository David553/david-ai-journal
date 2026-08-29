---
title: 训练 Infra 04：通信层与死锁诊断——5 小时静默死锁该怎么在 5 分钟内定位
date: 2026-08-30
summary: NCCL 五个集体原语与通信量公式、通信计算重叠、watchdog 超时机制的作用与局限，以及一套死锁诊断方法论：GPU 利用率形态学、py-spy 全集群扫栈、flight recorder，附四次真实排障复盘。
tags: [训练 Infra, NCCL, 死锁, 分布式调试, py-spy, 通信]
---

# 训练 Infra 04：通信层与死锁诊断

> 本节属于[大模型训练 Infra 实战课](/posts/2026-08-29-training-infra-course-index/)。[第 3 节](/posts/2026-08-30-training-infra-03-parallelism/)定下了 TP1/PP1/EP8/DP40，这一节讲这些并行维度实际怎么通信，以及通信坏掉时怎么查。

第 2 节那次事故——**个别 rank OOM，其余 39 个静默死锁 5 小时**——的根因在显存，但它之所以能烧掉 5 小时而不是 5 分钟，全在通信层。这一节先讲通信怎么工作，再讲它怎么坏，最后给一套能把 5 小时压到 5 分钟的诊断流程。

## 1. NCCL 的五个集体原语

### 直觉

集体通信（collective）不是"A 发给 B"，而是**一组 rank 一起完成一件事**。五个基本动作：

| 原语 | 做什么 | 输入→输出 | 谁在用 |
| --- | --- | --- | --- |
| **broadcast** | 一个 rank 的数据发给所有人 | S → S(每人) | 初始化同步权重、随机种子 |
| **all-reduce** | 所有人的数据求和(或均值)，结果每人一份 | S(每人) → S(每人) | DP 梯度同步、TP 每层 |
| **reduce-scatter** | 求和，但每人只拿结果的 1/N | S(每人) → S/N(每人) | ZeRO/distributed optimizer |
| **all-gather** | 每人贡献 1/N，拼成完整的给所有人 | S/N(每人) → S(每人) | 收权重、ZeRO-3 取参数 |
| **all-to-all** | 每人给每人发一块不同的数据 | S(每人) → S(每人)，但内容重排 | **EP 的专家分发** |

一个重要恒等式：

```
all-reduce = reduce-scatter + all-gather
```

这解释了为什么 distributed optimizer "免费"：本来就要 all-reduce 梯度，现在拆成两半，中间插入"各自更新自己那 1/N"——通信总量不变，却省下了 (N-1)/N 的优化器状态。**这是 ZeRO-1 最优雅的地方。**

### 通信量公式

ring 算法下的传输量（每个 rank 出入的字节数）：

```
all-reduce      : 2(N-1)/N × S
reduce-scatter  :  (N-1)/N × S
all-gather      :  (N-1)/N × S
broadcast       :  (N-1)/N × S  (树形/环形)
all-to-all      :  (N-1)/N × S  (但是 N×N 条独立流)
```

注意 all-reduce 的系数是 **2**，其他都是 1。N 较大时 (N-1)/N ≈ 1，所以粗算时：**all-reduce 约等于传两倍数据量，其余约等于传一倍。**

## 2. 代入项目：通信到底占多少时间

### DP 梯度同步(跨节点，走 RoCE)

Megatron 每步做一次 reduce-scatter + 一次 all-gather：

```
非专家:  参数 2.90B → bf16 梯度 5.8GB, DP组 40
         传输 = 2 × (39/40) × 5.8 = 11.3 GB
专家:    每卡 4.01B → bf16 梯度 8.0GB, DP组 5
         传输 = 2 × (4/5)  × 8.0 = 12.8 GB
         ------------------------------------
合计     24.1 GB / 卡 / 步
```

| RoCE 有效带宽 | 耗时 | 占 120 秒 |
| --- | --- | --- |
| 12.5 GB/s (100Gb) | 1.93 s | 1.6% |
| 25 GB/s (200Gb) | 0.97 s | 0.8% |
| 50 GB/s (400Gb) | 0.48 s | 0.4% |

**不到 2%。** 注意专家侧虽然 DP 组只有 5（分片差），但通信系数 2×(4/5)=1.6 反而比非专家的 2×(39/40)=1.95 更小——DP 组小，通信反而便宜。这是第 3 节那 8.4GB 显存代价的一点补偿。

### EP all-to-all(节点内，走 NVLink)

```
单次载荷 = top_k × seq × hidden × 2 B
每步总量 = 层数 × 2次 × 载荷 × micro_batch数
```

代入 seq=49152, hidden=2048, 48 层, 每步 2 个 micro batch：

| top_k | 每步总量 | NVLink(有效 400 GB/s) | 若跨节点 RoCE(25 GB/s) |
| --- | --- | --- | --- |
| 1 | 39 GB | 0.10 s (0.1%) | 1.55 s (1.3%) |
| 8 | 309 GB | 0.77 s (0.6%) | 12.4 s (**10.3%**) |

### 一个需要诚实说出来的结论

**在 120 秒一步的节奏下，所有通信加起来不到 3%。这套负载是彻底的算力受限。**

那第 1 节说"EP 必须关在 NVLink 域内"还成立吗？成立，但理由要修正：

- **不是平均带宽**：跨节点也就多花 10%（top_k=8 时）
- **而是三件更难量化的事**：
  1. **top_k 放大**：载荷随 top_k 线性增长，top_k=8 时跨节点已经到 10%
  2. **尾延迟与 incast**：all-to-all 是 N×N 全交叉，40 个 rank 同时向同一个 rank 发数据会造成 incast，RoCE 下容易触发 PFC 反压，实际带宽远低于标称，且**方差极大**
  3. **路由不均衡**：哪个专家热是数据决定的，某一步某条链路可能突然拥塞，而 all-to-all 一慢全慢

**换句话说，EP=8 买的不是平均性能，是"低方差"。** 分布式训练里，稳定比快更值钱——一步慢 10% 你可能都注意不到，但每 200 步卡一次 30 秒，你的排障时间会以天计。

## 3. 通信与计算重叠

### 直觉

通信和计算用的是不同的硬件资源（NVLink/网卡 vs SM），所以**可以同时进行**。不重叠就是纯浪费。

### Megatron 怎么做

```
反向传播是从最后一层往前算的。
第 48 层的梯度算完时,第 1 层还没开始。
→ 那就让第 48 层的梯度先去通信,同时继续算第 47 层。
```

具体机制是 **bucket**：把梯度按大小分组塞进连续 buffer，一个 bucket 填满就发起异步 reduce-scatter，用单独的 CUDA stream 跑，反向计算继续在主 stream 上进行。

```
主 stream :  [反向48][反向47][反向46][反向45] ... [反向1]
通信stream:         [RS b0]  [RS b1]  [RS b2]  ... [RS bk][AG]
                    ↑ 与计算重叠
```

同理，前向开始前的 all-gather 权重也可以和上一步的收尾重叠。

### 常见坑

**bucket 太小** → 通信次数多，每次都被固定延迟吃掉，带宽利用率低。
**bucket 太大** → 第一个 bucket 要等很久才满，重叠窗口变小。
**同步点意外插入** → 任何 `.item()`、`.cpu()`、`torch.cuda.synchronize()`、Python 侧的 `print(loss)` 都会强制等待，把重叠打断。**日志里每步打印 loss 是最常见的性能杀手**——正确做法是异步累积、每 N 步才同步一次。

## 4. watchdog 与超时机制

### 三个不同的东西

新手常把它们搞混：

| 机制 | 谁在管 | 触发后做什么 |
| --- | --- | --- |
| **NCCL watchdog** | PyTorch 的 `ProcessGroupNCCL` 后台线程 | 检测到某个 collective 超时 → 抛异常/abort 进程 |
| **`ddp_timeout` / `timeout=`** | 建 process group 时传入 | 定义"多久算超时"的阈值 |
| **NCCL 自身的超时** | 环境变量（如连接建立超时） | 主要影响初始化阶段 |

关键点：**watchdog 是唯一能把死锁变成崩溃的机制。** 没有它，死锁会永久持续。

### 事故复盘 ②:1 小时超时把死锁炸出来

项目里 `ddp_timeout` 是 1 小时量级。事故过程是：

```
T+0min   : 个别 rank OOM 退出
T+0min   : 其余 39 rank 进入 all-gather,开始等
T+60min  : watchdog 触发,抛出 collective timeout
T+60min~ : 但 traceback 打不出来(见下面复盘 ⑤)
...
T+300min : 人工发现
```

**watchdog 起了作用，但阈值定错了。** 1 小时对训练是保守的（怕误杀慢节点），但对排障是灾难。

### 怎么定这个阈值

参考基准是**单步耗时**：

```
阈值 ≈ 单步耗时 × (3 ~ 5) + checkpoint 时间余量

本项目: 单步 120 秒
     → 常规阈值 6 ~ 10 分钟
     → 但 checkpoint 要 8 分钟(第 1 节算的),所以要么把阈值放到 15 分钟,
       要么让 checkpoint 走独立的 process group / 不参与该超时
```

**10~15 分钟**是这套配置的合理值，比 1 小时好 4~6 倍。

### watchdog 的局限（重要）

watchdog 只能发现**卡在 NCCL collective 里**的情况。以下它一概管不了：

- 卡在数据加载（CPU 侧，NCCL 根本没被调用）
- 卡在 NFS IO
- Python 层死锁（GIL、多线程、`multiprocessing` 的 fork 问题）
- 某个 rank 陷入死循环但还在正常调用 collective
- 进程已经变成僵尸但 NCCL 连接没断

**所以除了 NCCL watchdog，你还需要一个应用层心跳**：每个 rank 每步写一行带时间戳的日志（或往一个共享位置更新心跳），外部脚本监控"最新心跳距今多久"。这个补充在第 7 节展开。

## 5. 死锁的形成机理

### 核心心智模型

> **集体通信是一场约会。组内每一个 rank 都必须到场，且必须按同一顺序参加同一批约会。**

由此推出死锁的三大类：

### 类型 A:有人没来（rank 死了或落后）

最常见。某个 rank OOM、被 OOM killer 杀、段错误、或者被 `kill` 掉。其余 rank 无限期等待。

**这就是那次 5 小时事故。**

### 类型 B:约会顺序不一致

所有 rank 都活着，但**调用 collective 的顺序不同**：

```
rank 0:  all_reduce(A)  →  all_gather(B)
rank 1:  all_gather(B)  →  all_reduce(A)
         ↑ 双方都在等对方参加自己那一场,永久死锁
```

典型触发原因：

- 代码里有 `if rank == 0:` 包住了某个 collective
- 基于数据的分支：`if loss > threshold: all_reduce(...)`，而不同 rank 的 loss 不同
- 变长序列导致某些 rank 的层数/专家数不同
- 异常处理路径里少调用/多调用了一次 collective

### 类型 C:环境不一致

所有 rank 都活着、顺序也对，但**通信算法协商不上**。这就是事故 ⑥。

NCCL 有大量环境变量会改变算法、协议、拓扑发现和传输层选择。如果 5 台机器里有 1 台不一样，双方"舞步"对不上——**表现为死锁或初始化挂死，报错信息几乎为零**。

## 6. 事故复盘 ⑥:多网卡选口与 bashrc 污染

### 两条独立的路

```
控制面(bootstrap/握手)  : socket    ← NCCL_SOCKET_IFNAME 选网口
数据面(实际传数据)      : RDMA      ← NCCL_IB_HCA 选 RoCE/IB 设备
```

多网卡机器上，NCCL 自动选口经常选错——选到 docker0、虚拟网桥、或一个物理上不通的口。症状是初始化卡住，或者性能莫名其妙只有标称的十分之一（悄悄退化到了慢速口）。

### 真正的坑:节点全局 bashrc

事故现场是：**某台机器的系统级 bashrc 里残留了 NCCL 调试变量**（很可能是之前某次排障留下的），导致那台机器上的 5 张卡走了不同的通信算法，集体通信直接死锁。

这类问题极难查，因为：

1. 报错信息为零
2. 症状不稳定（取决于哪台机器被分配到哪个角色）
3. 代码、配置、启动脚本全都是对的
4. 你根本不会想到去看 bashrc

### 治理规则

```
1. NCCL 环境变量只能由启动脚本统一注入,全集群逐字节一致
2. 系统级 /etc/profile、/etc/bashrc、~/.bashrc 里禁止出现任何 NCCL_* 
3. 启动时主动 dump 并 diff:
     每个 rank 打印 env | grep -E 'NCCL|TORCH|CUDA' | sort
     rank0 收集所有 rank 的结果做比对,不一致就拒绝启动
4. 长期方案:容器化。宿主机状态不可控,容器镜像可控(第 7 节)
```

**第 3 条是性价比最高的**——十几行代码，能挡掉一整类最难查的故障。

## 7. 诊断方法论

现在给出那套"5 小时 → 5 分钟"的流程。

### 第一步:GPU 利用率形态学

`nvidia-smi` 的利用率数字在死锁时会骗你，但**骗的方式是有规律的**，可以反过来当线索：

| 现象 | 含义 | 往哪查 |
| --- | --- | --- |
| **100% 但无进展** | 卡在 NCCL collective。NCCL 用 busy-wait 自旋轮询，会占满一个 CUDA kernel | 类型 A/B/C 死锁 |
| **0% 且显存已占** | 卡在 CPU 侧：数据加载、NFS IO、Python 死锁、`.item()` 等同步 | dataloader、文件系统 |
| **在 100% 和 0% 之间反复跳** | 正常，但可能有 straggler 或重叠没做好 | 性能问题，非死锁 |
| **部分卡 100%、部分卡 0%** | 极可能是死锁且 rank 状态分裂 | 立刻上 py-spy |

**记住这一条：100% 利用率不等于健康。** 这是分布式训练最反直觉的监控陷阱。

### 第二步:py-spy 全集群扫栈（事故 ④）

`py-spy` 能在**不侵入、不重启、不改代码**的前提下 dump 一个正在运行的 Python 进程的调用栈。这是死锁诊断的核武器。

思路是**给全集群拍一张同时刻的快照**：

```bash
# 在每个节点上,对每个训练进程 dump 栈
for pid in $(pgrep -f "pretrain_gpt|megatron|swift"); do
  py-spy dump --pid $pid > /shared/stacks/$(hostname)-$pid.txt 2>&1
done
```

然后把 40 份栈汇总，看**每个 rank 卡在哪一行**。事故 ④ 里，这一步直接还原出了死锁拓扑：

```
rank 7      : 进程已不存在              ← 凶手(OOM 退出)
rank 0-6,8..: torch.distributed.all_gather   ← 都在等那个不存在的 rank
其中 rank 12: ...all_to_all_single           ← 卡在更早的 EP 通信
```

**看到"有 rank 不存在 + 其余都在 collective 里"就可以结案了：类型 A 死锁。** 而如果所有 rank 都活着但卡在**不同的** collective，那是类型 B（顺序不一致）。

诊断口诀：

```
栈全一样 + 有 rank 缺席  → 类型 A,找那个死掉的 rank 的死因
栈不一样(不同collective) → 类型 B,查代码里的条件分支
栈全一样 + 全员在场      → 类型 C,查环境变量不一致 / 网络
```

### 第三步:flight recorder

PyTorch 内置的 NCCL "飞行记录仪"，记录最近 N 个 collective 的元信息（op 类型、大小、seq 号、开始/结束时间戳）。超时时会 dump 出来。

```
TORCH_NCCL_TRACE_BUFFER_SIZE=2000     # 启用,记录最近 2000 个 collective
TORCH_NCCL_DUMP_ON_TIMEOUT=1          # 超时自动 dump
TORCH_NCCL_DEBUG_INFO_TEMP_FILE=/shared/nccl_trace   # dump 到共享目录
```

它的独特价值是能回答 **"哪个 collective 没配对上"**：把各 rank 的 trace 按 seq 号对齐，缺失的那一行就是死锁点。这对类型 B 尤其有效——py-spy 只能看到"现在卡在哪"，flight recorder 能看到"之前的调用序列长什么样"。

**建议默认打开。** 开销很小，出事时价值巨大。

### 第四步:事故复盘 ⑤——先打印，再清理

这是个纯工程细节，但它让前面所有诊断手段都失效过一次。

现象：watchdog 超时了，异常抛出了，**但 traceback 打不出来**。

原因：异常处理路径里调用了 `destroy_process_group()` 做清理，而**这个调用本身也是一个集体操作，它同样会卡死**。于是：

```
try:
    train()
except Exception:
    destroy_process_group()   ← 卡死在这里,永远走不到下一行
    traceback.print_exc()     ← 永远执行不到
```

**修法很简单：先打印，再清理，且清理要加超时/容错。**

```python
except BaseException:
    # 1. 无论如何先把信息落到磁盘(带 rank 和主机名)
    import traceback, os, socket, sys
    tag = f"rank{os.environ.get('RANK','?')}-{socket.gethostname()}"
    with open(f"/shared/crash/{tag}.log", "w") as f:
        traceback.print_exc(file=f)
        f.flush(); os.fsync(f.fileno())
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()

    # 2. 然后才尝试清理,且不让它挡住退出
    try:
        dist.destroy_process_group()
    except BaseException:
        pass
    os._exit(1)      # 绕过可能卡住的 atexit / 析构
```

三个要点：

1. **打印在前，清理在后**
2. **落磁盘 + fsync**，别只依赖 stderr（stderr 可能因缓冲丢失，或被日志收集器吞掉）
3. **`os._exit(1)`** 而不是 `sys.exit(1)`——后者会走 atexit 和析构，那里可能还有集体操作在等着卡住你

### 完整流程

```
0. 建立基线:每步日志时间戳 + 心跳 + 每 rank 显存
1. 发现异常:某 rank 心跳停 / 步耗时突增 / watchdog 报警
2. 看形态:nvidia-smi -l 1  → 100%空转还是 0%
3. 扫栈  :py-spy dump 全集群,汇总比对
4. 看 trace:flight recorder 找未配对的 collective
5. 定性  :类型 A / B / C
6. 归因  :A→查死掉 rank 的日志和 dmesg;B→查条件分支;C→diff 环境变量
```

**有了这套流程,那次 5 小时的事故在第 2 步（看到 100% 空转）就该起疑，第 3 步（py-spy 发现 rank 缺席）就能结案。** 保守估计 5 分钟。

## 8. 常见坑

- **只看 rank0 日志**。rank0 通常是活着的那个，日志一片祥和。**所有日志必须带 rank 和主机名，且要能全集群汇总。**
- **用 GPU 利用率判断健康**。100% 可能是死锁自旋。
- **`ddp_timeout` 设得太长**。1 小时是把排障成本放大 6 倍。
- **在 except 里先做清理**。见复盘 ⑤。
- **每步 `print(loss.item())`**。强制同步，打断通信重叠。
- **假设环境一致**。5 台机器里总有 1 台不一样，这是墨菲定律在集群上的形态。
- **没开 flight recorder**。出事后才想起来开，但故障已经过去了。

## 思考题

**1.** 你观察到：40 个 rank 里有 8 个（恰好是一个节点）GPU 利用率 0%，其余 32 个 100%。py-spy 显示那 32 个都卡在 `all_to_all_single`，而那 8 个卡在 `torch.utils.data` 的 `__next__`。

- (a) 这是类型 A、B 还是 C？
- (b) 为什么卡在 dataloader 的那 8 个反而会让另外 32 个卡在 all-to-all？（提示：EP=8 的组是怎么划分的）
- (c) 你会先查什么？

**2.** 用本节的通信量公式估一下：如果把 global batch 从 80 提到 320（梯度累积从 2 变成 8，其他不变）：

- (a) DP 梯度同步的**总传输量**变不变？占单步时间的比例变不变？
- (b) EP all-to-all 的每步总量变成多少？
- (c) 这个改动对"通信占比"是好是坏？

---

下一节讲**训练框架景观**：transformers+DeepSpeed 为什么慢到 2.5 天而 Megatron 一夜跑完、mcore/SWIFT/FSDP 各自的定位、verl 的训练-rollout 混合架构，以及 cu128 这条约束链是怎么一路锁死 vllm≤0.19 和 torch≤2.11 的。
