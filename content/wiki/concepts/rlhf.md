---
title: "RLHF流程"
summary: "RLHF流程 的持续学习笔记。"
tags: [AI Wiki, Concept]
---

# RLHF

利用人类偏好信号优化模型行为的后训练方法。

## 在课程中的位置

- [系列 B：LLM 论文研究路线 第 7 课：RLHF 与对齐：从“会续写”到“愿意按人类偏好回答”](/posts/2026-07-17-cos597g-llm-research-07-rlhf-and-alignment/)
- [系列 C：从零实现语言模型与模型 Infra 第 8 课：后训练与评估：SFT、RLHF/RLVR、Benchmark 与部署门槛](/posts/2026-07-17-cs336-from-scratch-08-post-training-eval/)

## 学习检查

- 我能否不用术语复述它解决的问题？
- 我能否说出它依赖的前提和一个失败场景？
- 我能否把它连接到模型训练、推理、Agent 或产品系统里的具体位置？

## 2026-07-27

- 今日课程：[从"会接话"到"愿意好好答" —— SFT、RLHF 与 DPO](https://blog.ai-captain.top/posts/2026-07-27-ai-course-09-sft-rlhf-dpo/)。
- 关联日报：- **Nous 的 Hermes Agent 用「渐进式披露」让工具目录扩展到近乎无限的 MCP/插件（内部测试 3320 个工具几乎不掉精度）** —— 所有 MCP 工具收到单一 search-and-execute 层背后，仅在超过 5% 上下文时才隐藏명称，直击 MCP 大规模工具的 token 成本痛点，是当前 agent 工程的实际进展。[链接
