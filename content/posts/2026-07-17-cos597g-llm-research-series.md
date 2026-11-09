---
title: "系列 B：LLM 论文研究路线"
date: 2026-07-17
summary: "基于 Princeton COS 597G 的公开课程结构重构，训练读论文、拆机制、判断研究贡献的能力。"
tags: [大学课程拆解, Princeton COS 597G, 大模型基础]
sourceCourse: "Princeton COS 597G"
sourceUrl: "https://www.cs.princeton.edu/courses/archive/fall22/cos597G/"
---
# 系列 B：LLM 论文研究路线

基于 Princeton COS 597G 的公开课程结构重构，训练读论文、拆机制、判断研究贡献的能力。

## 定位

适合想把 LLM 论文读透的人：每节课围绕一个研究主题，训练“问题—方法—证据—局限”的阅读方式。

COS 597G 是研究生讨论课，围绕 BERT、T5、GPT、prompting、reasoning、retrieval、RLHF、code/multimodal LMs 等论文主题组织。

## 课程目录

- 第 1 课：[BERTology：怎样研究一个预训练模型到底学了什么](/posts/2026-07-17-cos597g-llm-research-01-bertology/) — BERT / probing / representation / attention analysis
- 第 2 课：[T5 与 text-to-text：把所有 NLP 任务统一成生成问题](/posts/2026-07-17-cos597g-llm-research-02-t5-text-to-text/) — T5 / text-to-text / span corruption / transfer learning
- 第 3 课：[GPT 系列与 few-shot：为什么 prompt 变成了编程接口](/posts/2026-07-17-cos597g-llm-research-03-gpt-few-shot/) — GPT-2 / GPT-3 / few-shot learning / prompting
- 第 4 课：[Prompting 与 In-Context Learning：上下文里的学习是真学习吗](/posts/2026-07-17-cos597g-llm-research-04-prompting-and-icl/) — in-context learning / prompt engineering / demonstrations / calibration
- 第 5 课：[知识与推理：LLM 会背事实，也会伪造因果链](/posts/2026-07-17-cos597g-llm-research-05-reasoning-and-knowledge/) — reasoning / chain-of-thought / knowledge / faithfulness
- 第 6 课：[Retrieval-based LMs：把参数记忆和外部记忆分开](/posts/2026-07-17-cos597g-llm-research-06-retrieval-augmented-lms/) — RAG / retrieval / kNN-LM / memory augmentation
- 第 7 课：[RLHF 与对齐：从“会续写”到“愿意按人类偏好回答”](/posts/2026-07-17-cos597g-llm-research-07-rlhf-and-alignment/) — RLHF / preference model / instruction tuning / alignment
- 第 8 课：[代码模型与多模态模型：语言接口外溢到工具和视觉](/posts/2026-07-17-cos597g-llm-research-08-code-and-multimodal-lms/) — code LMs / program synthesis / CLIP / multimodal LMs

## 学习方法

- 先读中文拆解，建立概念地图。
- 再回到官方课程页面看原始 readings / slides / assignments。
- 每学完一节，把关键词写进自己的项目或日报系统里，看它能解释什么、不能解释什么。

## 官方来源

- [Princeton COS 597G 官方课程/大纲](https://www.cs.princeton.edu/courses/archive/fall22/cos597G/)
- [Princeton COS 597G 课程主页](https://www.cs.princeton.edu/courses/archive/fall22/cos597G/)
