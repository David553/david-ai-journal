---
title: "Stanford CS336 视频学习地图：从零实现语言模型"
date: 2026-07-17
summary: "整理 Stanford CS336 公开视频的 17 讲路线，按原理、训练、GPU/Kernel、并行、推理、数据和对齐拆成适合自学与 4060 实验的路径。"
tags: [Stanford CS336, 大模型基础, 视频课程, 模型 Infra]
---

# Stanford CS336 视频学习地图

这页整理 Stanford CS336: Language Modeling from Scratch 2025 公开视频路线。官方课程页说明 CS336 的目标是带学生走完整个语言模型开发过程：数据收集与清洗、Transformer 构建、训练、评估和部署。官方课程入口：[CS336](https://cs336.stanford.edu/)，视频 playlist：[Stanford CS336 Language Modeling from Scratch I 2025](https://www.youtube.com/playlist?list=PLoROMvodv4rOY23Y0BoGoBGgQ1zmU_MT_)。

我没有把完整视频镜像到本站。原因很简单：公开视频不等于可以二次分发视频文件。本站只保存学习地图、中文拆解和实验路线，视频仍链接到官方 YouTube。

## 当前抓取状态

- 已拉取：17 讲 playlist 元数据。
- 未拉取：视频文件。
- 未拉取：字幕/自动字幕。当前环境请求 YouTube transcript 时被要求登录确认不是 bot；后续可以在你授权浏览器 cookies 后补抓字幕，再做逐讲 transcript 级分析。

## 推荐学习顺序

不要只按视频顺序看。CS336 的顺序本身是合理的，但如果目标是“用 4060 跑通并理解 LLM infra”，我建议分成五个阶段：

1. 先看 Lecture 1–3：建立 tokenizer、PyTorch、资源核算、架构和超参的基本框架。
2. 再看 Lecture 5–8：理解 GPU、kernel、Triton 和并行，这是 infra 的核心。
3. 然后看 Lecture 10：推理，把训练模型变成服务。
4. 再回到 Lecture 9/11：Scaling laws，用成本和 loss 曲线理解模型规模。
5. 最后看 Lecture 12–17：评估、数据和对齐，理解模型能不能真的部署。

## 17 讲地图

### 1. Overview and Tokenization

视频：[Lecture 1](https://www.youtube.com/watch?v=SQ3fZ1sAqXI)

这一讲是入口。重点不是“tokenizer 是什么”，而是理解语言模型看到的世界不是字符和单词，而是 token 序列。Tokenizer 决定序列长度、词表大小、跨语言表现和训练/推理成本。

4060 实验建议：自己训练一个小 BPE tokenizer，对比英文、中文、代码三种文本的 token 数。你会直观看到：同样长度的文本，tokenizer 会显著改变上下文预算。

### 2. PyTorch, Resource Accounting

视频：[Lecture 2](https://www.youtube.com/watch?v=msHyYioAyNE)

这一讲是 CS336 最重要的工程入口之一。你要学会算参数、activation、FLOPs、显存和训练吞吐。大模型不是“写个网络就训练”，而是每一步都要做资源核算。

4060 实验建议：写一个小 Transformer，分别测 batch size、sequence length、hidden size 对显存的影响。记录 tokens/sec 和显存峰值。

### 3. Architectures, Hyperparameters

视频：[Lecture 3](https://www.youtube.com/watch?v=ptFiH_bHnJw)

这一讲把 Transformer 架构和超参连起来。层数、hidden size、attention heads、MLP ratio、context length、学习率和 batch size 都不是孤立选择，而是在算力预算内互相制约。

4060 实验建议：固定 token budget，训练 3 个不同宽度/深度的小模型，比较 loss 曲线。不要追求好结果，重点看超参变化如何影响稳定性。

### 4. Mixture of Experts

视频：[Lecture 4](https://www.youtube.com/watch?v=LPv1KfUXLCo)

MoE 的直觉是：不是每个 token 都激活全部参数，而是路由到部分 expert。它用更高参数容量换取相对可控的每 token 计算量，但会引入路由、负载均衡、通信和训练稳定性问题。

4060 实验建议：只做 toy MoE，不做大模型 MoE。实现 top-1 routing，看 expert 负载是否均衡。

### 5. GPUs

视频：[Lecture 5](https://www.youtube.com/watch?v=6OBtO9niT00)

这一讲是理解 infra 的分水岭。GPU 快不是因为“核心多”这么简单，而是因为矩阵运算、内存层级、带宽、并行调度和 kernel 实现共同作用。

4060 实验建议：测矩阵乘法大小变化下的吞吐；对比 CPU/GPU；记录小矩阵为什么吃不满 GPU。

### 6. Kernels, Triton

视频：[Lecture 6](https://www.youtube.com/watch?v=E8Mju53VB00)

Kernel 是把数学公式变成 GPU 上高效执行的代码。Triton 的价值是让你用相对高层的方式写自定义 GPU kernel。理解这一讲后，你会明白 FlashAttention 为什么不是改 attention 公式，而是改 IO 和分块方式。

4060 实验建议：写一个简单 vector add / matmul Triton kernel，再对比 PyTorch 原生实现。目标不是赢 PyTorch，而是理解 block、program id、memory load/store。

### 7. Parallelism 1

视频：[Lecture 7](https://www.youtube.com/watch?v=l1RJcDjzK8M)

并行训练的核心问题是：单卡放不下或算不快。Data parallel、tensor parallel、pipeline parallel 解决的是不同瓶颈，但都会引入通信成本。

4060 实验建议：单卡上不用真正做多卡并行，但要模拟数据并行的 gradient accumulation，理解 global batch size。

### 8. Parallelism 2

视频：[Lecture 8](https://www.youtube.com/watch?v=LHpr5ytssLo)

第二讲并行会更深入到组合策略和系统瓶颈。真正的大模型训练不是选一个并行方法，而是混合并行：数据、张量、流水线、ZeRO、checkpointing 一起用。

4060 实验建议：画出不同并行策略切分的是 batch、矩阵、层还是 optimizer state。这个图比在单卡硬跑并行更有价值。

### 9. Scaling laws 1

视频：[Lecture 9](https://www.youtube.com/watch?v=6Q-ESEmDf4Q)

Scaling law 让训练从玄学变成预算问题。你要理解参数量、数据 token 数、训练 FLOPs 和 loss 之间的经验关系。

4060 实验建议：用几个 tiny model 做简化 scaling 实验。不要期待拟合出严肃 law，重点是看 loss 随模型/数据/计算变化的方向。

### 10. Inference

视频：[Lecture 10](https://www.youtube.com/watch?v=fcgPYo3OtV0)

推理和训练是两套不同系统。训练追求吞吐，推理还要看首 token 延迟、decode 延迟、KV cache、batching、量化和并发调度。

4060 实验建议：跑一个小 GPT 推理 demo，分别测 prefill 和 decode；打开/关闭 KV cache；比较 fp16 和 4-bit 量化模型。

### 11. Scaling laws 2

视频：[Lecture 11](https://www.youtube.com/watch?v=OSYuUqGBQxw)

第二讲 scaling laws 适合结合训练决策看：在固定预算下，模型做大还是数据做多？训练更久还是换架构？这类判断会直接影响公司级训练成本。

4060 实验建议：把实验记录写成表格：模型参数、训练 token、step、loss、耗时、显存。培养“先算账”的习惯。

### 12. Evaluation

视频：[Lecture 12](https://www.youtube.com/watch?v=x-R5l2HsXqM)

评估不是跑 benchmark。你要区分能力评估、鲁棒性评估、安全评估、偏好评估和线上指标。尤其要警惕数据污染和 prompt 敏感性。

4060 实验建议：给同一个小模型设计 20 个固定 prompt，每次改采样参数，看输出稳定性。

### 13. Data 1

视频：[Lecture 13](https://www.youtube.com/watch?v=WePxmeXU1xg)

数据是模型质量的地基。抓取、清洗、去重、过滤、混合、采样都会改变模型行为。很多模型差异不是架构差异，而是 data recipe 差异。

4060 实验建议：用同一个模型结构，分别训练干净语料和噪声语料，对比 loss 和生成样本。

### 14. Data 2

视频：[Lecture 14](https://www.youtube.com/watch?v=9Cd0THLS1t0)

第二讲数据通常会更接近工程 recipe：质量过滤、domain mixture、合成数据、去重和 contamination。这里要形成一个判断：数据管线本身就是模型系统。

4060 实验建议：做一个小型数据过滤 pipeline，统计重复率、平均 token 长度、语言比例和低质量样本占比。

### 15. Alignment - SFT/RLHF

视频：[Lecture 15](https://www.youtube.com/watch?v=Dfu7vC9jo4w)

SFT/RLHF 把基础模型变成更愿意按人类意图回答的模型。SFT 学格式和任务，RLHF/偏好优化学偏好，但也会带来过度迎合、拒答偏差和 reward hacking。

4060 实验建议：不要在 4060 上硬做大模型 RLHF。可以做小模型 SFT，理解数据格式和 loss mask。

### 16. Alignment - RL 1

视频：[Lecture 16](https://www.youtube.com/watch?v=46f2QTDB08Q)

这一讲进入强化学习。重点是理解 policy、reward、advantage、KL 约束等概念怎样进入语言模型后训练。

4060 实验建议：做 bandit 或小型文本环境的 RL toy demo。先理解目标函数，不要急着训练真实 LLM。

### 17. Alignment - RL 2

视频：[Lecture 17](https://www.youtube.com/watch?v=JdGFdViaOJk)

最后一讲继续对齐里的 RL 问题。对今天的 LLM 来说，RL 不只是游戏式强化学习，而是把可验证任务、人类偏好或环境反馈转成训练信号。

4060 实验建议：把 RLHF/DPO/RLVR 的差异写成一页表：数据来源、reward 形式、训练稳定性、适用任务和主要风险。

## 对 4060 自学最关键的 8 个实验

1. 训练 BPE tokenizer。
2. 从零写 decoder-only Transformer。
3. 测 batch size / sequence length / hidden size 对显存的影响。
4. 训练 tiny LM 并画 loss curve。
5. 测 prefill vs decode。
6. 打开/关闭 KV cache。
7. 跑 4-bit 量化推理。
8. 做一个小型 SFT 数据格式实验。

这些实验跑通后，你对 LLM 的理解会比只看视频扎实很多：你会知道模型原理在哪里，infra 成本在哪里，论文说法落地时会遇到什么限制。

## 下一步

等你允许使用浏览器 cookies 或在台式机上登录 YouTube 后，我可以补做：

- 拉取每讲字幕。
- 按 transcript 做逐讲中文摘要。
- 提取每讲时间轴。
- 把每讲映射到本站 concept wiki。
- 给每讲生成“开车听”的中文音频讲解。
