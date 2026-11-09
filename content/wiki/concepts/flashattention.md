---
title: "FlashAttention"
summary: "IO-aware attention 实现，通过分块减少显存读写。"
tags: [AI Wiki, Concept, 大模型基础]
---

# FlashAttention

IO-aware attention 实现，通过分块减少显存读写。

## 在课程中的位置

- [系列 C：从零实现语言模型与模型 Infra 第 4 课：Attention Kernel 与 FlashAttention：为什么同一公式速度差很多](/posts/2026-07-17-cs336-from-scratch-04-attention-kernels/)

## 学习检查

- 我能否不用术语复述它解决的问题？
- 我能否说出它依赖的前提和一个失败场景？
- 我能否把它连接到模型训练、推理、Agent 或产品系统里的具体位置？
