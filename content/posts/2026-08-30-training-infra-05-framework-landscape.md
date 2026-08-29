---
title: 训练 Infra 05：框架景观——从 2.5 天到一夜跑完 2 epoch
date: 2026-08-30
summary: 拆解 transformers+DeepSpeed 与 Megatron-core 在 MoE 长序列上约 10 倍的性能差从哪来，梳理 mcore/SWIFT/FSDP/verl 的分层定位与 vllm 在训练管线中的三个角色，并把 cu128 这条约束链完整画出来。
tags: [训练 Infra, Megatron, DeepSpeed, FSDP, verl, vllm, 版本兼容]
---

# 训练 Infra 05：训练框架景观

> 本节属于[大模型训练 Infra 实战课](/posts/2026-08-29-training-infra-course-index/)。前四节讲的是原理，这一节讲承载这些原理的软件栈——以及为什么换个框架能快一个数量级。

项目里有一个极有说服力的对照实验：

```
v1: transformers + DeepSpeed  →  同数据 2.5 天
v2: Megatron-SWIFT (mcore 0.16) →  一夜跑完 2 epoch
```

保守折算（2.5 天 = 60 小时算 1 epoch，一夜 10 小时算 2 epoch）：**约 12 倍**。

同样的模型、同样的数据、同样的 40 张卡。这一节就是解释这 12 倍从哪来，顺带把整个框架栈的分层理清。

## 1. 分层:谁在解决什么问题

先建立一张分层图，避免把不同层级的东西当成竞品对比：

```
┌─────────────────────────────────────────────────────┐
│ 任务层    SFT / DPO / RL(GRPO,PPO)                  │
│           Megatron-SWIFT · verl · TRL               │
├─────────────────────────────────────────────────────┤
│ 并行引擎  megatron-core · DeepSpeed · FSDP          │
│           (TP/PP/EP/CP + ZeRO + 通信重叠)           │
├─────────────────────────────────────────────────────┤
│ 算子层    PyTorch · FlashAttention · Apex · TE      │
├─────────────────────────────────────────────────────┤
│ 通信/运行时  NCCL · CUDA · 驱动                     │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│ 推理引擎  vllm · SGLang   (评测 / rollout / judge)  │
└─────────────────────────────────────────────────────┘
```

**关键认知：Megatron-SWIFT 不是 megatron-core 的竞品，它是骑在 mcore 上的任务层。** 同理 verl 也是任务层，而且用的也是 mcore——这正是"一套 infra 两个入口"能成立的基础（第 8 节）。

## 2. transformers + DeepSpeed:好用，但不适合这个形状

### 定位

`transformers` 提供模型实现和训练循环，DeepSpeed 提供 ZeRO 分片。这套组合的最大优点是**上手快**：模型定义就是 HF 那份，配置就是一个 json，几乎不用改代码。

对于**中小模型、短序列、稠密结构**，它非常够用。

### 为什么在这个项目上慢 12 倍

原因不是一个，是一串。按影响排序：

**(1) ZeRO-3 的每层 all-gather**

35B 模型，DeepSpeed 想装下就基本只能上 ZeRO-3（切权重）。而 ZeRO-3 的代价是**前向每一层都要 all-gather 参数、反向再来一次**：

```
ZeRO-3 每步的参数通信 ≈ 2 × 层数 × (参数量 × 2B) / 有效带宽
```

对比 Megatron distributed optimizer（≈ZeRO-1/2）：**每步只通信一次梯度**（第 4 节算过 24.1GB，占 0.8%）。ZeRO-3 是把这个量乘上层数量级。

这是最大的一块。

**(2) MoE 的实现质量**

MoE 的核心算子是"把 token 按路由重排 → 分组做 GEMM → 再排回来"。这里的工程差距很大：

- **朴素实现**：为每个专家单独做一次小 GEMM，48 层 × N 个专家 = 上千次小 kernel 启动，GPU 大部分时间在等 kernel launch
- **mcore 的做法**：grouped GEMM（把多个专家的矩阵乘合成一次调用）+ 融合的 permute/unpermute kernel

`3B 激活参数`意味着单次 GEMM 本来就不大，kernel 启动开销占比会被放大。这一项在 MoE 上是数倍差距。

**(3) 通信与计算重叠**

第 4 节讲过的 bucket + 连续梯度 buffer。DeepSpeed 也有重叠机制，但 mcore 在长序列、EP 混合场景下的重叠做得更彻底。

**(4) 算子融合**

FusedAdam、fused layernorm/RMSNorm、fused RoPE、fused cross-entropy、TransformerEngine 的 fused attention。单项都是几个百分点，累起来可观。而且 fused CE 直接关系到第 2 节那个 15GB 的 logits 问题。

**(5) recompute 粒度**

mcore 支持按层、按块、selective 多种粒度，可以精细控制"省显存"和"多算"的比例。粗粒度的 full recompute 是 1.33 倍算力（第 2 节），而 selective 可以做到 1.1 倍。

### 结论

**这 12 倍不是"DeepSpeed 差"，是"形状不匹配"。** MoE + 49K 长序列 + 35B 参数，恰好踩中了 ZeRO-3 通信、小 GEMM、EP 实现三个短板。

如果是 7B 稠密模型 + 4K 序列，两者差距可能只有 20~30%，而 transformers+DeepSpeed 的开发效率优势会占上风。**选框架要看形状，不看排行榜。**

## 3. Megatron-LM / megatron-core

### 定位

`megatron-core`（mcore）是把 Megatron-LM 里的并行能力抽出来的库。它提供：

- 全部并行维度：TP / PP / EP / CP / SP，以及它们的组合
- distributed optimizer（第 3 节）
- 连续梯度 buffer + bucket 重叠
- 各种融合算子
- distributed checkpoint（每 rank 写自己的分片）

**代价是侵入性强**：模型必须按 mcore 的方式定义（`TransformerLayerSpec` 那一套），不能直接拿 HF 的实现来跑。这是它上手陡的根本原因。

### 项目底座

```
megatron-core 0.16
```

这个版本号很重要——它同时约束了 Megatron-SWIFT 和 verl 的可用版本，是整个技术栈的地基。

## 4. Megatron-SWIFT:任务层的粘合剂

### 它解决什么

裸 mcore 能跑训练，但不管这些事：

- HF 模型权重怎么转成 mcore 的分片格式（以及训完怎么转回去）
- SFT 的数据处理:chat template、多轮对话的 loss mask、packing
- 多模态输入怎么接
- LoRA、DPO 等各种训练目标
- 命令行参数、日志、评测的工程化

Megatron-SWIFT 就是把这些补齐，让你能用接近 HF 的体验拿到 mcore 的性能。**这是项目选它的核心理由。**

### 与 verl 共用底座的价值

```
Megatron-SWIFT (SFT)  ─┐
                       ├─→ megatron-core 0.16 ─→ safetensors
verl (RL)             ─┘
```

**同一个 mcore 底座 + safetensors 作为交换格式**，意味着 SFT 产出的 checkpoint 可以直接喂给 RL，不需要写格式转换和分片重排的胶水代码。这在工程上省下的时间以周计，也是第 8 节"一套 infra 两个入口"的技术前提。

## 5. FSDP:PyTorch 原生路线

### 定位

`FullyShardedDataParallel` 是 PyTorch 官方的分片方案，思路上等价于 ZeRO-3（切参数+梯度+优化器状态），但是原生集成、没有额外依赖。

| | FSDP | Megatron-core |
| --- | --- | --- |
| 并行维度 | 主要是分片 DP，TP/PP 要额外拼装 | TP/PP/EP/CP 齐全 |
| MoE 支持 | 需要自己搭 EP | 内建 |
| 侵入性 | 低（包一层就行） | 高（要按它的方式定义模型） |
| 长序列 | 需配合 CP 实现 | 内建 |
| 生态 | PyTorch 原生，版本跟得紧 | 独立发版 |

### 什么时候选 FSDP

- 稠密模型、不需要 TP/PP
- 想紧跟 PyTorch 版本、不想被第三方库的版本矩阵绑住
- 模型结构非标准，用 mcore 要大改

**对本项目（MoE + EP + 长序列）不合适**——你会把 mcore 已经做好的 EP 和 CP 重新实现一遍。

## 6. verl:RL 框架的架构

### 核心难题

RL（PPO/GRPO 这类）比 SFT 复杂的地方在于，一步里要做**两种性质完全不同的计算**：

```
1. rollout(生成)   : 自回归 decode,memory-bound,要 KV cache,batch 动态
2. train(更新)     : 大 GEMM,compute-bound,要梯度和优化器状态
```

这两件事的最优系统设计是**相反的**——推理引擎（vllm/SGLang）为 decode 优化，训练引擎（mcore）为 GEMM 优化。硬凑到一个引擎里，两边都不好。

### verl 的思路

verl（HybridFlow）的做法是**混合引擎 + 单控制器**：

```
       ┌──────────── controller(单点,写起来像单机代码) ─────────┐
       │                                                        │
       ▼                                                        ▼
 ┌──────────┐   prompt   ┌─────────────┐  经验   ┌───────────────┐
 │ rollout  │◀───────────│  经验/缓冲   │────────▶│  train worker │
 │ (vllm)   │──响应─────▶│              │         │  (mcore/FSDP) │
 └──────────┘            └─────────────┘         └───────────────┘
      ▲                        ▲                        │
      │                        │                        │
      └────── 权重同步 ────────┴──── reward/judge 服务 ──┘
```

三个关键设计：

1. **single-controller + multi-worker**：控制流写成单机的顺序代码（"生成→打分→更新"），数据流由框架分发到各 worker。这让 RL 算法的逻辑可读，不至于淹没在通信代码里。
2. **引擎可替换**：rollout 用 vllm 或 SGLang，train 用 mcore 或 FSDP，按需组合。
3. **权重同步是一等公民**：训练更新完的权重要送回 rollout 引擎，这是 RL infra 最脏的一块（第 8 节详解）。

### 对本项目的含义

选 verl + mcore 后端，等于 SFT 和 RL 共享：并行配置的经验、显存账的算法、排障的工具链。**第 1 到 4 节学的东西在 RL 阶段一条都不浪费。**

## 7. 推理引擎在训练管线里的三个角色

很多人以为 vllm/SGLang 只是"部署用的"。在训练管线里它们至少有三个位置：

| 角色 | 干什么 | 要求 |
| --- | --- | --- |
| **评测** | 每 N 个 checkpoint 跑一遍 benchmark | 吞吐优先，可离线批量 |
| **rollout** | RL 里生成候选响应 | 延迟+吞吐都要，需频繁热更新权重 |
| **judge 服务** | 用另一个模型给响应打分 | 稳定、可并发、常驻 |

其中 **rollout 的要求最苛刻**：它需要在训练过程中反复被灌入新权重（每个 RL step 一次），而大多数推理引擎的设计假设是"权重加载一次就不动了"。这就是第 8 节要讲的权重同步问题。

## 8. 版本兼容矩阵思维:cu128 约束链

### 起点是一个不能动的数

```
GPU 驱动 → 支持的 CUDA 上限 = 12.8
```

驱动升级需要停机、需要运维窗口、在共享集群上可能根本不被批准。**所以这是一个硬约束，其他所有东西都要绕着它走。**

### 约束怎么传播

```
CUDA 12.8 (cu128)
   │
   ├─→ PyTorch: 只能用有 cu128 wheel 的版本 → torch ≤ 2.11
   │      │
   │      ├─→ megatron-core: 需匹配 torch ABI → 0.16
   │      │
   │      ├─→ vllm: 每个版本钉死一个 torch → vllm ≤ 0.19
   │      │
   │      └─→ FlashAttention / TransformerEngine / Apex:
   │             都是编译型扩展,必须对齐 torch + CUDA
   │
   └─→ SGLang: 依赖链(flashinfer 等)要求更高的 CUDA → 出局
```

### 为什么"编译型扩展"是关键词

纯 Python 包升级无所谓。但训练栈里一大半是 **C++/CUDA 编译出来的**：

- FlashAttention、Apex、TransformerEngine
- vllm 的 attention/paged kernel
- megatron-core 的融合算子

这些包和 `torch` 的 C++ ABI 绑死。torch 版本一动，它们全部要重新编译或换版本。**这是为什么"升级一个包"经常演变成"重建整个环境"。**

### 实践规则

1. **先定驱动/CUDA，再往上定 torch，最后定所有依赖**。反过来做一定翻车。
2. **写下来并锁死**。一份 `requirements.lock` + 一个镜像 tag，不要靠"pip install 最新版"。
3. **矩阵表要包含编译型扩展的版本**，不只是 Python 包名。
4. **RL 阶段约束更紧**：训练侧要 mcore+torch，rollout 侧要 vllm+torch，**两边必须是同一个 torch**。这让可行版本的交集变得很小——本项目 `torch ≤ 2.11` 且 `vllm ≤ 0.19` 就是这个交集的边界。
5. **容器化**。这是唯一能让"环境"变成可版本化、可回滚对象的办法（第 7 节）。

### 一个值得画出来的表

建议在项目里维护这样一张表，每次动任何一格都要全表复核：

| 组件 | 当前版本 | 被谁约束 | 升级会连带什么 |
| --- | --- | --- | --- |
| 驱动 / CUDA | 12.8 | 集群运维策略 | 一切 |
| torch | ≤ 2.11 | cu128 wheel 可用性 | mcore, vllm, FA, TE, Apex |
| megatron-core | 0.16 | torch ABI | Megatron-SWIFT, verl |
| Megatron-SWIFT | 对应 mcore 0.16 | mcore | SFT 入口 |
| verl | 对应 mcore 0.16 | mcore + vllm | RL 入口 |
| vllm | ≤ 0.19 | torch | rollout / 评测 / judge |
| SGLang | — | CUDA 需求过高 | **出局** |

## 9. 常见坑

- **按 benchmark 选框架**。别人的 benchmark 是别人的形状。MoE+长序列这个形状会把结论完全颠倒。
- **以为 SWIFT 和 mcore 是竞品**。它们是上下层关系，SWIFT 的性能就是 mcore 的性能。
- **在 ZeRO-3 上硬扛 MoE**。每层 all-gather 参数 + 小 GEMM，两个短板叠加。
- **先装最新版再解决冲突**。约束链是自顶向下的，反着来会陷入依赖地狱。
- **忘了 rollout 和 train 必须共享 torch 版本**。这是 RL 阶段最容易被忽略的约束。
- **没有锁文件**。三个月后"同一份代码"跑不出同样的结果，因为某个依赖悄悄升级了。
- **在宿主机上直接 pip install**。第 7 节会讲这为什么是事故温床。

## 思考题

**1.** 假设明天运维批准把驱动升到支持 CUDA 12.9，SGLang 因此可用了。

- (a) 按约束链，你需要按什么顺序重新验证哪些组件？
- (b) 你会在什么时机做这件事——SFT 阶段中途，还是等 RL 开始前？为什么？
- (c) 换 SGLang 相比 vllm，对 RL 的 rollout 有什么可能的收益和风险？

**2.** 有人建议 RL 阶段 rollout 用 FSDP 后端、train 也用 FSDP（放弃 mcore），理由是"版本依赖更简单"。

- (a) 你会失去什么？（提示：回到第 3 节，EP 和 CP 怎么办）
- (b) 会得到什么？
- (c) 用 SFT 那 12 倍的教训来判断，这个交易划算吗？

---

下一节讲**吞吐与效率**：手把手用项目数字算 MFU——6ND 公式、recompute 系数 4/3、MFU 与 HFU 的区别，然后回答"H20 上 8-10% 是什么水平"，并算出一个可能被忽略的 41% 的浪费。
