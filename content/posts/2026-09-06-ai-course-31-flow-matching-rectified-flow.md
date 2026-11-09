---
title: "AI 基础课 31：让噪声走直线 —— Flow Matching、Rectified Flow 与现代扩散模型的训练目标"
date: 2026-09-06
summary: "生成式 AI 与模型 Infra 基础课：让噪声走直线 —— Flow Matching、Rectified Flow 与现代扩散模型的训练目标。"
tags: [AI 基础课, 生成式 AI, 模型原理]
sourceConcepts: [— Flow Matching、Rectified Flow 与现代扩散模型的训练目标 — Flow Matching流匹配, 概率路径(probability path), 直线插值路径x_t=(1-t)x_0+tε, 速度场v=ε-x_0, 条件流匹配CFM损失, v-prediction与ε/x_0-prediction的线性等价, ODE采样与欧拉法, 确定性采样与轨迹反演(流视角), Rectified Flow, 轨迹交叉与边缘速度场曲率, reflow重配对拉直, 少步采样与截断误差, logit-normal时间步采样, 分辨率相关timestep shift, DiT(patchify+adaLN), MMDiT双流注意力(概念), SD3(案例), Flux/Wan沿用配方(提及)]
---

## 第31课：让噪声走直线 —— Flow Matching、Rectified Flow 与现代扩散模型的训练目标

### 本课目标

第10课我们把 diffusion 理解成「一步步加噪、再学着一步步去噪」，第28课讲了条件怎么进去（CFG）、为什么在 latent 空间做，第30课讲了另一条把图像离散化的路线。今天补上 diffusion 这条线最后一块基础：**2023 年以后的主流图像/视频模型（SD3、Flux、Wan、可灵这类）基本都不再用 DDPM 的训练目标，而是用 Flow Matching / Rectified Flow**。学完你能回答：

- 为什么现在的论文说自己是「diffusion 模型」，训练公式里却没有 β 调度、没有 ε-prediction？
- 「把轨迹拉直」到底拉直了什么，为什么能少步采样？
- SD3 / Flux 论文里的 `rectified flow + logit-normal timestep sampling + MMDiT` 三个词分别在解决什么问题？

### 经典案例

Rectified Flow（Liu et al., 2022）与 Stable Diffusion 3（2024）：后者把前者作为训练目标，在 latent 空间上用 Transformer 骨干（MMDiT）替代 U-Net，是「flow matching 进入工业级文生图」的标志性系统。

### 背景铺垫

**1. 从「加噪过程」换成「一条路径」。** DDPM 把前向过程定义成 T 步马尔可夫加噪，需要一张 β 表。Flow Matching 换个视角：只要一条从数据到噪声的**连续路径**。最简单的选法是直线插值：

```
x_t = (1 - t) * x_0 + t * ε        t ∈ [0, 1]，x_0 是数据，ε ~ N(0, I)
```

t = 0 是干净数据，t = 1 是纯噪声，中间每个 t 都是二者的线性混合。它对应第10课里「一步加噪闭式公式」的特例，只是系数从 √ᾱ_t 换成了 (1−t) 和 t，不需要任何调度表。

**2. 学的不是噪声，是「速度」。** 沿着这条直线，x_t 对 t 的导数是常数：

```
v = dx_t / dt = ε - x_0
```

Flow Matching 训练一个网络 v_θ(x_t, t)（有条件就再加 c）去回归这个速度，损失就是均方误差：

```
L = E_{t, x_0, ε} || v_θ(x_t, t) - (ε - x_0) ||²
```

这就是论文里的 **Conditional Flow Matching（CFM）loss**。对比第10课的 ε-prediction：给定 x_t 和 t，ε、x_0、v 三者互为线性组合（x_0 = x_t − t·v，ε = x_t + (1−t)·v），所以「预测什么」只是同一信息的不同参数化；v 的好处是在 t 两端数值都稳定，不像 ε-prediction 在 t→0 时目标几乎无信息、x_0-prediction 在 t→1 时几乎无信息。

**3. 采样 = 解一个常微分方程（ODE）。** 训练好 v_θ 后，生成就是从噪声出发沿速度场往回走：

```
x ← ε                      # t = 1
for t from 1 down to 0, step h:
    x ← x - h * v_θ(x, t)  # 欧拉法
```

这和第28课的 DDIM 一样是**确定性**采样：同一个 ε 永远生成同一张图，可以做插值和反演。步数 N 决定 ODE 解的精度，直线轨迹意味着欧拉法几乎没有截断误差，理论上一步就能到。

**4. 「直」是有条件的。** 每个 (x_0, ε) 配对的路径是直的，但网络学到的是**给定 x_t 的平均速度**：很多条直线在中间交叉时，平均出来的场是弯的，所以实际轨迹仍有曲率，少步采样会偏。Rectified Flow 的核心操作是 **reflow**：用训练好的模型从噪声 ε 生成 x̂_0，再用 (x̂_0, ε) 这些「不再交叉」的配对重新训练一遍，轨迹逐轮变直。做一到两轮 reflow 后，4~8 步采样就能接近 50 步的质量，这正是少步蒸馏模型的基础之一。

**5. 时间步怎么采。** 直觉上中间的 t 最难（既不是纯噪声也不是干净图，速度最难估），SD3 因此不用均匀采 t，而是用 **logit-normal 分布**把采样质量集中在 t≈0.5 附近；分辩率越高，图像 token 越多，同样噪声量下信噪比更高，所以还要对 t 做**分辩率相关的偏移（timestep shift）**，让高分辩率训练也能采到足够「难」的噪声水平。

**6. 骨干换成 Transformer。** U-Net 的卷积归纳偏置在 latent 上不再必要。DiT 的做法是：latent 按第11课的 patchify 切成 token，条件用第28课讲过的 adaLN 注入；SD3 的 MMDiT 进一步让文本 token 和图像 token 各走一套权重、只在注意力里交汇，解决文本理解弱的问题。**这也是为什么后面的视频模型能直接复用「3D patch + 全注意力 + flow matching」这一套。**

### 回到案例

把 SD3 论文里的三件事对号入座：`rectified flow` 是训练目标（直线路径 + 速度回归 + ODE 采样）；`logit-normal sampling + resolution shift` 是让训练算力花在最难的时间步上；`MMDiT` 是把条件注入和骨干一起换成更能 scale 的 Transformer。Flux、Wan 之类基本沿用了这一配方，差别在数据、尺度和条件设计，而不是训练目标本身。

### 动手 / 思考

1. 20 行体验 flow matching（2D 玩具数据，CPU 几秒跑完）：

```python
import torch, torch.nn as nn
def data(n):                      # 目标分布：两个高斯团
    c = torch.randint(0, 2, (n, 1)).float() * 4 - 2
    return torch.cat([c, torch.zeros(n, 1)], 1) + 0.3 * torch.randn(n, 2)
net = nn.Sequential(nn.Linear(3, 128), nn.SiLU(), nn.Linear(128, 128), nn.SiLU(), nn.Linear(128, 2))
opt = torch.optim.Adam(net.parameters(), 1e-3)
for step in range(3000):
    x0, eps = data(512), torch.randn(512, 2)
    t = torch.rand(512, 1)
    xt = (1 - t) * x0 + t * eps
    loss = ((net(torch.cat([xt, t], 1)) - (eps - x0)) ** 2).mean()   # CFM loss
    opt.zero_grad(); loss.backward(); opt.step()
x = torch.randn(2000, 2)                                              # 采样：欧拉法 8 步
for i in range(8):
    t = torch.full((2000, 1), 1 - i / 8)
    x = x - (1 / 8) * net(torch.cat([x, t], 1))
print(x[:, 0].round().unique(return_counts=True))                     # 应集中在 -2 和 2 附近
```

把步数改成 1、2、4，看两团能否分开——这就是「轨迹不够直」的直观后果。

2. 思考题：第28课的 CFG 是对 ε（或 score）做 `ε_uncond + w·(ε_cond − ε_uncond)`。既然 v 与 ε 是线性关系，把 CFG 直接套到 v 上是否等价？w 过大时，在 flow matching 下会先出现什么现象？
