---
title: "KV Cache显存碎片"
summary: "KV Cache显存碎片 的持续学习笔记。"
tags: [AI Wiki, Concept]
---

# KV cache

推理时缓存历史 key/value，避免重复计算上下文。

## 在课程中的位置

- [系列 C：从零实现语言模型与模型 Infra 第 6 课：推理 Serving：KV Cache、batching、prefill/decode 分离](/posts/2026-07-17-cs336-from-scratch-06-inference-serving/)

## 学习检查

- 我能否不用术语复述它解决的问题？
- 我能否说出它依赖的前提和一个失败场景？
- 我能否把它连接到模型训练、推理、Agent 或产品系统里的具体位置？

## 2026-07-29

- 今日课程：[让语言模型"看见" —— ViT、模态对齐与视觉语言模型（VLM）](https://blog.ai-captain.top/posts/2026-07-29-ai-course-11-language-model-probability/)。
- 关联日报：- **MXAttention 提出免数据校准的 MXFP4 注意力量化方案，针对扩散视频生成模型解决幂次缩放的截断/下溢权衡与行归一化两大数值问题** —— 注意力的二次开销是视频生成推理的最大瓶颈，若 FP4 注意力能如作者声称的保住生成质量，视频模型推理成本有望显著下降。[链接](http://arxiv.org/abs/2607.24377v1)

## 2026-08-05

- 今日课程：[一台 GPU 同时服务上百个请求 —— 从静态批处理到 Continuous Batching 与 PagedAttention](https://blog.ai-captain.top/posts/2026-08-05-ai-course-17-attention/)。
- 关联日报：- **Databricks 宣布 Unity AI Gateway 正式 GA** —— 面向企业的 AI 网关/治理层，统一管控成本、安全与多模型/多 agent 调用，官方称过去一年已处理超一千万亿(quadrillion)tokens；企业级 agent 治理落地的强信号。[链接](https://x.com/databricks/status/20
