import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { buildSite } from '../src/build.mjs'

test('buildSite creates home, article, feed and not-found pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'david-journal-'))
  const postsDir = path.join(root, 'posts')
  const wikiDir = path.join(root, 'wiki')
  const outputDir = path.join(root, 'dist')
  await mkdir(postsDir)
  await mkdir(path.join(wikiDir, 'concepts'), { recursive: true })
  await writeFile(
    path.join(postsDir, 'hello-ai.md'),
    `---
title: 与 AI 一起写作
date: 2026-07-14
summary: 把每天的对话沉淀成可以回看的思想。
tags: [AI, 写作]
audio: /audio/hello-ai.mp3
audioDuration: "08:30"
---

这不是自动生成内容，而是共同编辑。`,
  )
  await writeFile(
    path.join(wikiDir, 'index.md'),
    `---
title: AI 学习 Wiki
summary: 每天更新的 AI 学习知识库。
tags: [AI Wiki]
---

# AI 学习 Wiki

- [Embedding](/wiki/concepts/embedding/)`,
  )
  await writeFile(
    path.join(wikiDir, 'concepts', 'embedding.md'),
    `---
title: Embedding
summary: 向量表示入门。
tags: [AI Wiki, Concept]
---

# Embedding

概念页。`,
  )

  await buildSite({ postsDir, wikiDir, outputDir, publicDir: null })

  const home = await readFile(path.join(outputDir, 'index.html'), 'utf8')
  const article = await readFile(path.join(outputDir, 'posts/hello-ai/index.html'), 'utf8')
  const wikiIndex = await readFile(path.join(outputDir, 'wiki/index.html'), 'utf8')
  const concept = await readFile(path.join(outputDir, 'wiki/concepts/embedding/index.html'), 'utf8')
  const feed = await readFile(path.join(outputDir, 'feed.xml'), 'utf8')
  const notFound = await readFile(path.join(outputDir, '404.html'), 'utf8')

  assert.match(home, /与 AI 一起写作/)
  assert.match(home, /把每天的对话沉淀成可以回看的思想/)
  assert.match(article, /共同编辑/)
  assert.match(article, /返回全部思考/)
  assert.match(article, /class="prose"/)
  assert.match(article, /<audio controls/)
  assert.match(article, /src="\/audio\/hello-ai\.mp3"/)
  assert.match(article, /08:30/)
  assert.match(article, /data-media-title="与 AI 一起写作"/)
  assert.doesNotMatch(article, /class="prose reveal"/)
  assert.match(wikiIndex, /AI 学习 Wiki/)
  assert.match(concept, /向量表示入门/)
  assert.match(feed, /<rss/)
  assert.match(feed, /<enclosure url="https:\/\/blog\.ai-captain\.top\/audio\/hello-ai\.mp3"/)
  assert.match(notFound, /页面走丢了/)
})

test('buildSite renders official YouTube player for video lessons', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'david-journal-video-'))
  const postsDir = path.join(root, 'posts')
  const outputDir = path.join(root, 'dist')
  await mkdir(postsDir)
  await writeFile(
    path.join(postsDir, 'video-lesson.md'),
    `---
title: Video Lesson
date: 2026-07-17
summary: Has official video.
tags: [Video]
youtubeId: SQ3fZ1sAqXI
youtubeUrl: https://www.youtube.com/watch?v=SQ3fZ1sAqXI
---

# Video Lesson
`,
  )

  await buildSite({ postsDir, wikiDir: null, outputDir, publicDir: null })

  const article = await readFile(path.join(outputDir, 'posts/video-lesson/index.html'), 'utf8')
  assert.match(article, /OFFICIAL VIDEO/)
  assert.match(article, /youtube\.com\/embed\/SQ3fZ1sAqXI/)
  assert.match(article, /Open official YouTube/)
})
