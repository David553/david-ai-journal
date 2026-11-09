---
title: "连续批处理(continuous batching)"
summary: "连续批处理(continuous batching) 的持续学习笔记。"
tags: [AI Wiki, Concept]
---

# continuous batching

Serving 中动态合批请求以提升吞吐的调度方法。

## 在课程中的位置

- [系列 C：从零实现语言模型与模型 Infra 第 6 课：推理 Serving：KV Cache、batching、prefill/decode 分离](/posts/2026-07-17-cs336-from-scratch-06-inference-serving/)

## 学习检查

- 我能否不用术语复述它解决的问题？
- 我能否说出它依赖的前提和一个失败场景？
- 我能否把它连接到模型训练、推理、Agent 或产品系统里的具体位置？

## 2026-08-05

- 今日课程：[一台 GPU 同时服务上百个请求 —— 从静态批处理到 Continuous Batching 与 PagedAttention](https://blog.ai-captain.top/posts/2026-08-05-ai-course-17-attention/)。
- 关联日报：- **Databricks 宣布 Unity AI Gateway 正式 GA** —— 面向企业的 AI 网关/治理层，统一管控成本、安全与多模型/多 agent 调用，官方称过去一年已处理超一千万亿(quadrillion)tokens；企业级 agent 治理落地的强信号。[链接](https://x.com/databricks/status/20
