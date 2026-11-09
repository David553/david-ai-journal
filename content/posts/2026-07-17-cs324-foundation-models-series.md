---
title: "系列 A：Foundation Models 全景基础"
date: 2026-07-17
summary: "基于 Stanford CS324 的公开大纲重构，建立大模型的能力、数据、训练、架构、适配与风险全景。"
tags: [大学课程拆解, Stanford CS324, 大模型基础]
sourceCourse: "Stanford CS324"
sourceUrl: "https://stanford-cs324.github.io/winter2023/syllabus/"
---
# 系列 A：Foundation Models 全景基础

基于 Stanford CS324 的公开大纲重构，建立大模型的能力、数据、训练、架构、适配与风险全景。

## 定位

适合作为总览路线：先知道大模型为什么重要、由哪些系统部件组成、能力和风险边界在哪里。

CS324 把大模型放在 foundation model 的完整系统里：能力、数据、架构、训练、规模化、适配、风险与社会影响。

## 课程目录

- 第 1 课：[什么是 Foundation Model：从任务模型到通用底座](/posts/2026-07-17-cs324-foundation-models-01-foundation-model-map/) — foundation model / 预训练 / 下游任务 / 迁移学习
- 第 2 课：[数据决定模型上限：语料、去重、混合与污染](/posts/2026-07-17-cs324-foundation-models-02-data-and-dedup/) — 训练数据 / 数据去重 / 数据混合 / benchmark contamination
- 第 3 课：[架构与训练目标：BERT、GPT、T5 为什么不同](/posts/2026-07-17-cs324-foundation-models-03-architecture-objectives/) — encoder-only / decoder-only / encoder-decoder / masked LM / causal LM
- 第 4 课：[能力从哪里冒出来：规模、上下文学习与评估幻觉](/posts/2026-07-17-cs324-foundation-models-04-emergent-capabilities/) — emergent abilities / in-context learning / few-shot / scaling
- 第 5 课：[适配大模型：Prompt、SFT、LoRA、RAG 的分工](/posts/2026-07-17-cs324-foundation-models-05-adaptation-stack/) — prompting / SFT / LoRA / RAG / domain adaptation
- 第 6 课：[训练与 Infra：为什么大模型首先是分布式系统](/posts/2026-07-17-cs324-foundation-models-06-training-infrastructure/) — distributed training / data parallelism / tensor parallelism / pipeline parallelism / checkpointing
- 第 7 课：[Scaling Laws：参数、数据、算力的三角关系](/posts/2026-07-17-cs324-foundation-models-07-scaling-and-cost/) — scaling laws / compute optimal / Chinchilla / loss curve
- 第 8 课：[风险不是附录：安全、隐私、偏见、版权与能耗](/posts/2026-07-17-cs324-foundation-models-08-risk-and-governance/) — AI safety / privacy / bias / copyright / environmental impact

## 学习方法

- 先读中文拆解，建立概念地图。
- 再回到官方课程页面看原始 readings / slides / assignments。
- 每学完一节，把关键词写进自己的项目或日报系统里，看它能解释什么、不能解释什么。

## 官方来源

- [Stanford CS324 官方课程/大纲](https://stanford-cs324.github.io/winter2023/syllabus/)
- [Stanford CS324 课程主页](https://stanford-cs324.github.io/winter2022/)
