---
title: 训练 Infra 07：稳定性工程——失败模式、监控、checkpoint 与脏环境治理
date: 2026-08-30
summary: 把训练故障分成五类并给出各自的探测手段，用 Young/Daly 公式算出这套集群的最优 save_steps 约等于 77，并复盘"被 kill 的进程显存未释放导致新任务启动即 OOM"的脏启动竞态与根治方案。
tags: [训练 Infra, 稳定性, checkpoint, 监控, 容器化, 故障排查]
---

# 训练 Infra 07：稳定性工程

> 本节属于[大模型训练 Infra 实战课](/posts/2026-08-29-training-infra-course-index/)。前六节讲怎么让训练跑得对、跑得快。这一节讲怎么让它**别停**。

一个残酷的经验数字：大规模训练任务里，**用于排查故障和重跑的时间，经常超过纯计算时间**。这一节讲的东西不提高 MFU 一个百分点，但它决定你的 40 张卡一个月里有多少天在真正训练。

## 1. 失败模式分类

先把故障分类，因为**不同类别的探测手段完全不同**。混在一起想，就会出现"加了一堆监控但真出事时还是不知道看哪"。

| 类别 | 典型现象 | 探测手段 | 平均定位难度 |
| --- | --- | --- | --- |
| **OOM** | 某 rank 崩溃，常在 step 1 之后 | 每 rank 显存日志 + dmesg | 低（如果日志到位） |
| **死锁** | 无进展，GPU 100% 或 0% | 心跳 + py-spy + flight recorder | 中（第 4 节的流程） |
| **慢节点(straggler)** | 步耗时突增且不恢复 | 每 rank 分段计时 | 中高 |
| **硬件故障** | ECC 错误、掉卡、NVLink 降级 | `nvidia-smi -q`、dmesg、xid | 中 |
| **数据问题** | loss 突刺/NaN、某步特别慢 | 数据 checksum + 样本长度分布 | 高 |

### 各类的关键要点

**OOM**：第 2 节讲透了。核心是**显存日志必须记 step 1 之后的 `max_memory_allocated`**，且每个 rank 都要记。被系统 OOM killer 杀掉的进程连 Python 异常都不会有，只能从 `dmesg` 里找。

**死锁**：第 4 节的完整流程。核心是**不要相信 GPU 利用率**。

**慢节点**：这是最容易被忽略的一类。集体通信让整组的速度等于最慢的那个，所以**一张卡降频/一条链路降级，会让 40 张卡一起变慢**，而所有卡看起来都很"忙"。探测方法是记录**每 rank 的分段耗时**：

```
每步记录: 前向耗时 / 反向耗时 / 通信等待耗时 / 优化器耗时
```

关键是**"通信等待耗时"**这一项。慢节点自己的通信等待很短（大家都在等它），而其他 39 个 rank 的通信等待会异常长。**通信等待时间的分布，就是慢节点的指纹。**

常见成因：GPU 温度墙降频、单条 NVLink 降级到低带宽、某网卡跑在错误的速率、CPU 被别的进程抢占、NUMA 绑核不对、这台机器上的 NFS 挂载不健康。

**硬件故障**：定期采集 `nvidia-smi -q` 里的 ECC 计数、时钟节流原因（`Clocks Throttle Reasons`）、NVLink 状态。Xid 错误要从 `dmesg` 抓。**ECC 可纠正错误的计数持续上升是换卡的先兆**。

**数据问题**：多模态 + 变长序列的组合下这一类会变多。一个超长样本、一张损坏的图、一段异常的 token 分布都可能引发 OOM 或 loss 突刺。**建议记录每步的样本 id 列表**——出问题时能立刻定位到具体样本，这个日志的价值远超它的成本。

## 2. 监控设计

### 三层结构

```
第 1 层 · 进度与健康(必须有,秒级)
    每 rank 每步: step号, 时间戳, loss, grad_norm, lr,
                  max_memory_allocated, 分段耗时
    → 落到文件 + 汇总到一处

第 2 层 · 趋势(tensorboard / 类似工具)
    loss, grad_norm, 吞吐 tok/s, MFU, 学习率
    MoE 专有: 专家负载分布, drop rate, router 熵
    → 用于看训练质量,不用于故障探测

第 3 层 · 看门狗(外部进程,独立于训练)
    读第 1 层的心跳: "最新心跳距今 > 阈值" → 报警/自动处置
    → 必须是独立进程,训练挂了它还活着
```

### 第 3 层为什么必须独立

第 4 节讲过 NCCL watchdog 的局限：它只能发现卡在 collective 里的情况，管不了数据加载卡住、NFS 挂死、Python 死锁。

而**一个在训练进程之外运行的心跳监控，能发现所有"没进展"的情况**，不管原因是什么。它的逻辑简单到可以用几十行 shell 写：

```
每 60 秒:
  读所有 rank 的心跳文件,取最新时间戳
  if now - max(timestamps) > 3 × 单步耗时:
      触发诊断包采集(py-spy 全集群扫栈 + nvidia-smi + dmesg 尾部)
      报警
```

**注意"触发诊断包采集"这一步**——报警的同时自动把现场抓下来。因为等人赶到时，进程可能已经被别人重启了，现场就没了。第 4 节那套 py-spy 流程应该是自动的，不是手动的。

### MoE 专有指标

除了通用指标，MoE 一定要看这三个：

| 指标 | 健康表现 | 异常含义 |
| --- | --- | --- |
| 专家负载分布 | 相对均匀 | 塌缩到少数专家 → router collapse |
| drop rate | 低且稳定 | 突增 → 路由不均或容量因子太小 |
| router 熵 | 稳定，不持续下降 | 持续下降 → 专家多样性在丢失 |

**这三个指标比 loss 更早报警。** router collapse 时 loss 可能还在缓慢下降，但模型实际上已经退化成了一个稠密小模型——你付着 35B 的显存和通信成本，拿到 3B 的效果。

## 3. checkpoint 策略

### 写入成本（回到第 1 节那笔账）

```
唯一数据量:
  bf16 权重     35e9 × 2  = 70 GB
  优化器状态    35e9 × 12 = 420 GB
  --------------------------------
  合计                    = 490 GB

NFS 写带宽约 1 GB/s → 一次 ≈ 490 秒 ≈ 8.2 分钟 ≈ 4 个训练步
```

### 去重的价值

```
每 rank 各写本地全量态: 约 972 GB   (非专家在 40 张卡上重复,专家分片在 5 张卡上重复)
只写唯一分片(mcore 的 distributed checkpoint): 490 GB
```

**差 2 倍。** 这就是为什么要用 Megatron 的 distributed checkpoint 而不是"每个 rank 各存一份 state_dict"。

### 最优 save_steps:Young/Daly 公式

checkpoint 频率是一个可以算的最优化问题。经典结论：

```
最优间隔 = sqrt(2 × C × MTBF)

C    = 写一次 checkpoint 的耗时
MTBF = 平均无故障时间
```

直觉：存太密，开销大；存太疏，崩一次损失大。最优点在两者平衡处。

代入 `C = 490 秒`、单步 120 秒：

| MTBF | 最优间隔 | ≈ save_steps | checkpoint 开销 | 崩溃期望损失 |
| --- | --- | --- | --- | --- |
| 4 小时 | 1.04 h | **31** | 11.5% | 0.52 h |
| 8 小时 | 1.48 h | **44** | 8.4% | 0.74 h |
| 24 小时 | 2.56 h | **77** | 5.1% | 1.28 h |
| 72 小时 | 4.43 h | **133** | 3.0% | 2.21 h |

对照几个常见的拍脑袋取值：

| save_steps | 间隔 | 开销 | 崩溃期望损失 |
| --- | --- | --- | --- |
| 50 | 1.67 h | 7.6% | 0.83 h |
| 100 | 3.33 h | 3.9% | 1.67 h |
| 200 | 6.67 h | 2.0% | 3.33 h |
| 500 | 16.67 h | 0.8% | **8.33 h** |

**所以关键问题是：你们的 MTBF 是多少？**

- 如果一天崩一次（MTBF 24h），`save_steps ≈ 77`，开销 5%
- 如果还在调试期、几小时就出事（MTBF 4-8h），`save_steps ≈ 30-45`，开销 8-12%——**这个开销是值得付的**
- `save_steps=500` 只有在 MTBF 超过一周时才合理

**建议：先记录实际的 MTBF（每次任务中断都记时间和原因），再代公式。** 调试期用 30-50，稳定后放到 77-100。

### 异步 checkpoint

如果不想付这 5-10%，标准做法是**异步**：

```
1. 训练进程把状态拷到本地 NVMe(快,几十秒)
2. 立刻恢复训练
3. 后台进程慢慢把本地盘的内容搬到 NFS
```

代价是需要本地盘空间（每节点约 100GB 量级），以及要处理"上一次还没搬完，下一次又来了"的情况。收益是 checkpoint 的**阻塞时间**从 8 分钟降到几十秒。

### safetensors 与格式

```
训练态(mcore 分片 + 优化器) → 用于断点续训,格式绑定 mcore 版本
交付态(safetensors,只有权重) → 用于评测、RL rollout、对外交付
```

两者用途不同，都要存。safetensors 的价值在于**它是框架中立的交换格式**——第 5 节讲过，这正是 SFT 的产出能直接喂给 verl 的原因。

### 断点续训的三个必查项

续训最怕的是"跑起来了，但其实状态不对"。至少要验证：

1. **优化器状态真的恢复了**：检查 Adam 的 m/v 不是全零。少这一步，续训相当于重新 warmup，loss 会有个明显的坑。
2. **数据顺序恢复了**：dataloader 的采样器状态、epoch 内的位置、随机种子。否则会重复训练同一批数据，或者跳过一部分。
3. **学习率调度器的 step 数恢复了**：否则 lr 会跳回到 warmup 阶段。

**验证方法：续训后头几步的 loss 应该和中断前的最后几步平滑衔接。** 如果有明显跳变，上面三项一定有一项错了。这个检查花一分钟，能省掉几天的困惑。

## 4. 事故复盘 ③:脏启动竞态

### 现象

上一个任务被 `kill` 掉。立刻启动新任务，**新任务启动即 OOM**。

### 根因

**被 kill 的进程，显存不一定立刻释放。**

原因有好几种，都很常见：

1. **进程还在退出过程中**。`kill` 发的是 SIGTERM，进程要走信号处理、析构、CUDA context 销毁。显存在 CUDA context 真正销毁时才归还，这可能要几秒到几十秒。
2. **进程变成僵尸/D 状态**。如果它卡在不可中断的内核调用里（比如 NFS IO、或某些 GPU 驱动调用），`kill` 根本杀不掉它，显存永久占着，直到那个调用返回或机器重启。
3. **子进程泄漏**。torchrun 会 fork 出很多进程（dataloader worker 等），杀主进程时子进程可能变成孤儿继续持有显存。
4. **NCCL/CUDA 的共享内存和 IPC 句柄残留**在 `/dev/shm`。

于是就出现了竞态：**新任务在旧任务的显存还没归还时启动，看到的可用显存不够，直接 OOM。** 而且因为第 2 节讲的原因（惰性初始化 + 非均匀分片），这个 OOM 可能只发生在个别 rank 上，然后又变成一次静默死锁——**两个事故叠加**。

### 根治:启动前排空

在训练脚本最前面加一道"排空闸门"，**不通过就拒绝启动**：

```bash
#!/usr/bin/env bash
# drain.sh —— 每个节点在启动训练前必须先通过这一关
set -euo pipefail

PATTERN='pretrain_gpt|megatron|swift|torchrun|verl'
NEED_FREE_MB=${NEED_FREE_MB:-90000}     # 96GB 卡,要求至少 90GB 可用
TIMEOUT=${TIMEOUT:-180}

# 1. 先礼后兵地清掉残留进程
pids=$(pgrep -f "$PATTERN" || true)
if [[ -n "$pids" ]]; then
  echo "[drain] 发现残留进程: $pids,发送 SIGTERM"
  kill -TERM $pids 2>/dev/null || true
  sleep 15
  pids=$(pgrep -f "$PATTERN" || true)
  if [[ -n "$pids" ]]; then
    echo "[drain] 仍存活,发送 SIGKILL: $pids"
    kill -KILL $pids 2>/dev/null || true
  fi
fi

# 2. 清 IPC/共享内存残留
rm -rf /dev/shm/nccl-* /dev/shm/torch_* 2>/dev/null || true

# 3. 轮询等显存真正归还 —— 这是最关键的一步
deadline=$((SECONDS + TIMEOUT))
while true; do
  # 取所有卡里"可用显存最小"的那一张
  min_free=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits \
             | sort -n | head -1)
  if (( min_free >= NEED_FREE_MB )); then
    echo "[drain] OK: 最小可用显存 ${min_free}MB >= ${NEED_FREE_MB}MB"
    break
  fi
  if (( SECONDS >= deadline )); then
    echo "[drain] 失败: 等了 ${TIMEOUT}s,最小可用仍只有 ${min_free}MB"
    echo "[drain] 占用者:"
    nvidia-smi --query-compute-apps=pid,used_memory,process_name \
               --format=csv
    # D 状态进程无法杀掉,只能人工介入
    ps -eo pid,stat,wchan:32,cmd | awk '$2 ~ /D/' || true
    exit 1        # ← 关键:拒绝启动,而不是硬着头皮上
  fi
  sleep 5
done
```

### 三个设计要点

1. **看"最小可用显存"，不是平均**。一张卡不干净就会让整个任务死锁，木桶效应。
2. **超时就退出（`exit 1`），不要继续**。硬着头皮启动的后果是 5 小时静默死锁，代价远大于"晚 3 分钟启动"。
3. **失败时打印占用者和 D 状态进程**。D 状态（不可中断睡眠）的进程杀不掉，这种情况需要人工介入甚至重启节点——脚本要能明确告诉你"这不是我能解决的"。

**这道闸门要在每个节点上跑，且必须全部通过才启动训练。** 建议做成 launcher 的一部分，而不是靠人记得执行。

## 5. 脏环境治理

### 三种"脏"

| 脏源 | 表现 | 治理 |
| --- | --- | --- |
| **环境变量污染** | 集体通信死锁，无报错（事故 ⑥） | 统一注入 + 启动时 diff |
| **显存/进程残留** | 启动即 OOM（事故 ③） | 排空闸门 |
| **Python 环境漂移** | 三个月后同样代码跑不出同样结果 | 锁文件 + 镜像 |

### 环境变量:启动时 diff

第 4 节给了规则，这里给实现思路。启动后每个 rank 做一件事：

```python
import os, json, socket, hashlib
import torch.distributed as dist

KEYS = ('NCCL_', 'TORCH_', 'CUDA_', 'OMP_', 'GLOO_')

def assert_env_consistent():
    env = {k: v for k, v in os.environ.items() if k.startswith(KEYS)}
    # 排除天然应当不同的
    for k in ('CUDA_VISIBLE_DEVICES', 'NCCL_COMM_ID'):
        env.pop(k, None)
    blob = json.dumps(env, sort_keys=True)
    digest = hashlib.sha256(blob.encode()).hexdigest()[:16]

    gathered = [None] * dist.get_world_size()
    dist.all_gather_object(gathered, (digest, socket.gethostname(), blob))

    if dist.get_rank() == 0:
        groups = {}
        for d, host, b in gathered:
            groups.setdefault(d, []).append(host)
        if len(groups) > 1:
            print("[env] 环境变量不一致! 分组情况:")
            for d, hosts in groups.items():
                print(f"  {d}: {sorted(set(hosts))}")
            # 打印差异明细,然后终止
            raise RuntimeError("环境变量跨节点不一致,拒绝继续")
        print(f"[env] OK,全集群一致: {digest}")
```

**十几行代码，挡掉一整类最难查的故障。** 注意它必须在 `init_process_group` 之后、真正训练之前跑——而且它自己就是一次 all_gather，如果连这一步都挂住，那本身就是最早的信号。

### 容器化的真正价值

容器化经常被当成"部署方便"，但在训练集群上它的价值是别的：

```
没有容器:  "环境" = 宿主机上所有人历史操作的叠加
           不可版本化、不可回滚、不可复现、不可审计

有容器:    "环境" = 一个 image tag
           可版本化、可回滚、可复现、可 diff
```

具体解决什么：

1. **bashrc 污染消失**：容器里的环境由 Dockerfile 定义，别人往宿主机 bashrc 里写什么都不影响你
2. **依赖锁定**：第 5 节那条 cu128 约束链被固化在镜像里，不会有人"顺手升级一下"
3. **可复现**：三个月后用同一个 tag，跑出同样的结果
4. **多任务隔离**：不同实验用不同镜像，互不干扰

**代价**：需要处理 GPU 直通（`--gpus all`）、IPC（`--ipc=host` 或加大 shm）、网络（RDMA 设备直通、`--net=host`）、NFS 挂载。这些都是一次性的工程投入。

**建议**：即使短期不上容器，也至少要做到"依赖有锁文件 + 环境变量由启动脚本统一注入 + 启动前排空 + 启动时 diff"。这四条能覆盖容器化八成的收益，而工作量小一个数量级。

## 6. 一份启动前检查清单

把本课程前七节的教训压成一张可执行的表：

```
[ ] 1. 排空:所有节点最小可用显存 >= 90GB,无残留进程 (第 7 节)
[ ] 2. 环境:全集群 NCCL_*/TORCH_*/CUDA_* 变量 diff 一致 (第 4/7 节)
[ ] 3. 网卡:NCCL_SOCKET_IFNAME 和 NCCL_IB_HCA 显式指定 (第 1 节)
[ ] 4. 显存预算:算过峰值,含优化器状态,留 >=8% 余量 (第 2 节)
[ ] 5. 预热:启动即做一次 dry-run step,提前 alloc 优化器状态 (第 2 节)
[ ] 6. 整除:TP×PP×CP×DP = world 且 EP | DP (第 3 节)
[ ] 7. 超时:ddp_timeout 设 10-15 分钟,不是 1 小时 (第 4 节)
[ ] 8. 记录:flight recorder 打开,dump 到共享目录 (第 4 节)
[ ] 9. 异常:except 里先打印落盘再清理,用 os._exit (第 4 节)
[ ] 10. 日志:每 rank 每步的 loss/显存/分段耗时,带 rank 和主机名 (第 7 节)
[ ] 11. 心跳:独立看门狗进程,超时自动抓诊断包 (第 7 节)
[ ] 12. checkpoint:save_steps 按 MTBF 算过,不是拍的 (第 7 节)
[ ] 13. 续训:验证过 loss 平滑衔接 (第 7 节)
[ ] 14. MoE:专家负载/drop rate/router 熵 三个指标在看 (第 7 节)
```

## 7. 常见坑

- **监控只有 loss 曲线**。loss 正常但 router 已经塌缩、或某节点已降频，你看不出来。
- **看门狗跑在训练进程里**。训练挂了它也挂了。
- **save_steps 拍脑袋**。500 在 MTBF 8 小时的集群上意味着期望损失 8 小时。
- **只存训练态不存 safetensors**，或反过来。两者用途不同。
- **续训不验证衔接**。优化器状态没恢复的续训，看起来在跑，实际上在浪费。
- **kill 完立刻重启**。事故 ③ 的完整复现路径。
- **把"环境"当成给定条件**。它是你需要主动管理的对象。
- **报警了但没抓现场**。人赶到时进程已被重启，只能等下次。

## 思考题

**1.** 你们记录了一个月，发现任务中断 6 次：3 次 OOM（都在调整配置后的第一步）、2 次单节点掉卡、1 次 NFS 挂死。

- (a) MTBF 大约是多少？按 Young/Daly，`save_steps` 该设多少？
- (b) 那 3 次 OOM 用本节清单的哪几条可以完全避免？
- (c) NFS 挂死那次，NCCL watchdog 能发现吗？什么能发现？

**2.** 有人提议把 checkpoint 改成异步（先落本地 NVMe，后台搬 NFS）。

- (a) 阻塞时间从 8.2 分钟降到多少？（假设本地 NVMe 写 2 GB/s）
- (b) 这时候 Young/Daly 里的 C 变成多少？最优 save_steps 变成多少（按 MTBF 24h）？
- (c) 新引入了什么故障模式？（提示：本地盘满了会怎样、搬运没完成就崩了会怎样）

---

最后一节讲**从 SFT infra 到 RL infra 的演进**：rollout 引擎、reward 服务、权重同步这三块新增部件，以及"一套 infra 两个入口"的设计思想——前七节学的东西，在 RL 阶段哪些直接复用、哪些要重新算。
