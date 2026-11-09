---
title: "系列 C：从零实现语言模型与模型 Infra"
date: 2026-07-17
summary: "基于 Stanford CS336 的公开安排重构，按工程实现顺序学习 tokenizer、Transformer、训练、并行、推理、数据与后训练。"
tags: [大学课程拆解, Stanford CS336, 大模型基础]
sourceCourse: "Stanford CS336"
sourceUrl: "https://cs336.stanford.edu/"
---
# 系列 C：从零实现语言模型与模型 Infra

基于 Stanford CS336 的公开安排重构，按工程实现顺序学习 tokenizer、Transformer、训练、并行、推理、数据与后训练。

## 定位

适合工程路线：不满足于“知道概念”，而是能估算资源、写出组件、解释瓶颈、做出训练和推理取舍。

CS336 以“从零实现语言模型”为主线，把 tokenizer、Transformer、资源核算、GPU kernel、并行、推理、数据、后训练串成工程闭环。

## 课程目录

- 第 1 课：[Tokenizer：模型看到的不是字，而是 token 序列](/posts/2026-07-17-cs336-from-scratch-01-tokenization/) — tokenization / BPE / vocabulary / Unicode
- 第 2 课：[资源核算：FLOPs、显存、带宽和 arithmetic intensity](/posts/2026-07-17-cs336-from-scratch-02-resource-accounting/) — FLOPs / memory bandwidth / arithmetic intensity / activation memory
- 第 3 课：[Transformer Block：Attention、MLP、Norm 与残差的组合](/posts/2026-07-17-cs336-from-scratch-03-transformer-block/) — Transformer / self-attention / MLP / LayerNorm / residual connection
- 第 4 课：[Attention Kernel 与 FlashAttention：为什么同一公式速度差很多](/posts/2026-07-17-cs336-from-scratch-04-attention-kernels/) — attention kernel / FlashAttention / tiling / SRAM / HBM
- 第 5 课：[并行训练：DP、TP、PP、ZeRO 各自解决什么问题](/posts/2026-07-17-cs336-from-scratch-05-parallel-training/) — data parallelism / tensor parallelism / pipeline parallelism / ZeRO
- 第 6 课：[推理 Serving：KV Cache、batching、prefill/decode 分离](/posts/2026-07-17-cs336-from-scratch-06-inference-serving/) — LLM inference / KV cache / continuous batching / prefill / decode
- 第 7 课：[预训练数据管线：抓取、过滤、去重、混合、采样](/posts/2026-07-17-cs336-from-scratch-07-data-pipeline/) — data pipeline / filtering / deduplication / data mixing / synthetic data
- 第 8 课：[后训练与评估：SFT、RLHF/RLVR、Benchmark 与部署门槛](/posts/2026-07-17-cs336-from-scratch-08-post-training-eval/) — SFT / RLHF / RLVR / evaluation / deployment

## 学习方法

- 先读中文拆解，建立概念地图。
- 再回到官方课程页面看原始 readings / slides / assignments。
- 每学完一节，把关键词写进自己的项目或日报系统里，看它能解释什么、不能解释什么。

## 官方来源

- [Stanford CS336 官方课程/大纲](https://cs336.stanford.edu/)
- [Stanford CS336 课程主页](https://cs336.stanford.edu/)
