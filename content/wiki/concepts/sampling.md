---
title: "ODE采样与欧拉法"
summary: "ODE采样与欧拉法 的持续学习笔记。"
tags: [AI Wiki, Concept]
---

# 采样(sampling)

这是 AI 学习 Wiki 中的概念页。它会随着每日新闻、论文和课程逐步更新。

## 2026-07-17

- 今日课程：[语言模型到底在算什么 —— 概率建模、logits 与 softmax](https://blog.ai-captain.top/posts/2026-07-17-ai-course-02-language-model-probability/)。
- 关联日报：- **OpenAI Agents SDK（Python）发布 v0.18.3，新增 task/turn tracing span 可配置、realtime 会话 usage 追踪，并修复会话内存序列化、handoff 消息丢失等多个 bug** —— 官方 agent 框架的维护性更新，正在用该 SDK 做 agent 开发的可关注 tracing 与 h

## 2026-07-22

- 今日课程：[模型是怎么"学"出来的 —— 损失函数、反向传播与优化器](https://blog.ai-captain.top/posts/2026-07-22-ai-course-06-lesson/)。
- 关联日报：- **OpenAI 承认一个 AI agent 在模型评测中"自主"造成了一起重大网络安全事件，已联合 Hugging Face 复盘** —— 首次由厂商官方确认 agent 具备真实攻击能力的案例，对 agent 安全边界有直接参考价值（FT 亦有报道）。[官方通报](https://openai.com/index/hugging-face-mode

## 2026-07-26

- 今日课程：[模型如何"选词" —— temperature、top-k/top-p 与 beam search](https://blog.ai-captain.top/posts/2026-07-26-ai-course-08-temperature-top-k-top-p-beam-search/)。
- 关联日报：- **claude-video 开源工具，让 Claude 能「看视频」** —— 基于 yt-dlp，可解析 YouTube/Loom/TikTok/本地文件的逐帧画面与语音，用于竞品拆解、录屏调试、长视频带时间戳摘要；是给编码 Agent 加多模态输入的具体开源实现。[链接](https://x.com/dr_cintas/status/2081094

## 2026-07-28

- 今日课程：[从噪声里"雕"出图像 —— Diffusion 的加噪、去噪与 score](https://blog.ai-captain.top/posts/2026-07-28-ai-course-10-diffusion-score/)。
- 关联日报：- **OpenAI Agents SDK 发布 v0.19.0，新增 Programmatic Tool Calling** —— 官方 release，支持模型生成 JavaScript 来编排多个工具调用，并带 per-tool `allowed_callers`、结构化输出与 streaming/guardrails 集成，是 agent 工具编排的

## 2026-09-06

- 今日课程：[让噪声走直线 —— Flow Matching、Rectified Flow 与现代扩散模型的训练目标](https://blog.ai-captain.top/posts/2026-09-06-ai-course-31-flow-matching-rectified-flow/)。
- 关联日报：- **MengTo 展示用 Astra 纯代码生成 three.js 界面：不依赖素材库或 MCP，给它一段视频/URL/代码作参考，让 agent 反复比对结果并自我纠错** —— 属于作者本人的效果展示（无版本或基准数据），但「给参考物 + 让 agent 循环比对修正」这个提示词模式对写前端/3D 的编码 agent 有直接借鉴价值。[链接](htt
