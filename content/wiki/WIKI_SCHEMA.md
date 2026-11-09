---
title: "AI Learning Wiki Schema"
summary: "约束 AI 学习 Wiki 的来源、页面类型、更新规则和 lint 规则。"
tags: [AI Wiki, Schema]
---

# AI Learning Wiki Schema

这个 wiki 按 Karpathy 的 LLM Wiki 模式维护：

- `raw/` 是不可变来源，保存每日抓取的新闻、论文和链接。
- `content/wiki/` 是 LLM/脚本维护的结构化知识层，会被腾讯云博客发布。
- `index.md` 是内容索引，`log.md` 是时间日志。

## 更新规则

1. 每次日报运行都必须追加 `log.md`。
2. 每次课程发布都必须更新相关 concept 页面。
3. 新建页面用于独立概念、公司、论文或系统；旧页面用于补充已有概念的新事实。
4. 页面要优先链接到课程和原始来源，不把聊天记录当作事实来源。

## 周期性 lint

检查孤立页面、缺少课程链接的概念、被新来源推翻但未标注的旧结论，以及频繁出现但尚未建页的概念。
