import assert from 'node:assert/strict'
import test from 'node:test'

import { parsePost } from '../src/content.mjs'

test('parsePost turns front matter and markdown into a publishable post', () => {
  const source = `---
title: 第一篇思考
date: 2026-07-14
summary: 从一次对话开始。
tags:
  - AI
  - 产品
---

## 为什么记录

每天留下一个可复用的判断。`

  const post = parsePost('first-thought.md', source)

  assert.equal(post.slug, 'first-thought')
  assert.equal(post.title, '第一篇思考')
  assert.equal(post.date, '2026-07-14')
  assert.deepEqual(post.tags, ['AI', '产品'])
  assert.match(post.html, /<h2[^>]*>为什么记录<\/h2>/)
  assert.match(post.html, /每天留下一个可复用的判断/)
})

test('parsePost rejects articles without required metadata', () => {
  assert.throws(
    () => parsePost('broken.md', '# 没有元数据'),
    /title.*date.*summary/i,
  )
})

test('parsePost preserves optional audio metadata', () => {
  const post = parsePost('embedding.md', `---
title: Embedding
date: 2026-07-16
summary: 向量空间入门
audio: /audio/embedding.mp3
audioDuration: "12:34"
---

正文`)

  assert.equal(post.audio, '/audio/embedding.mp3')
  assert.equal(post.audioDuration, '12:34')
})
