# David · 思考生长中

一个由 Markdown 驱动、人与 AI 共同整理的个人博客。静态构建，无数据库，提交到 `main` 后由 GitHub Actions 自动发布。

## 写一篇文章

在 `content/posts/` 新建 Markdown 文件：

```md
---
title: 文章标题
date: 2026-07-14
summary: 一句话摘要
tags: [AI, 产品]
---

正文从这里开始。
```

## 本地运行

```bash
npm install
npm test
npm run dev
```

访问 <http://127.0.0.1:4173>。

## 发布

推送到 GitHub `main` 分支后，流水线会执行测试、静态构建并通过专属低权限 SSH 用户同步到腾讯云服务器。生产访问地址由服务器端口或后续绑定域名决定。
