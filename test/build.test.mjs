import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { buildSite } from '../src/build.mjs'

test('buildSite creates home, article, feed and not-found pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'david-journal-'))
  const postsDir = path.join(root, 'posts')
  const outputDir = path.join(root, 'dist')
  await mkdir(postsDir)
  await writeFile(
    path.join(postsDir, 'hello-ai.md'),
    `---
title: 与 AI 一起写作
date: 2026-07-14
summary: 把每天的对话沉淀成可以回看的思想。
tags: [AI, 写作]
---

这不是自动生成内容，而是共同编辑。`,
  )

  await buildSite({ postsDir, outputDir, publicDir: null })

  const home = await readFile(path.join(outputDir, 'index.html'), 'utf8')
  const article = await readFile(path.join(outputDir, 'posts/hello-ai/index.html'), 'utf8')
  const feed = await readFile(path.join(outputDir, 'feed.xml'), 'utf8')
  const notFound = await readFile(path.join(outputDir, '404.html'), 'utf8')

  assert.match(home, /与 AI 一起写作/)
  assert.match(home, /把每天的对话沉淀成可以回看的思想/)
  assert.match(article, /共同编辑/)
  assert.match(article, /返回全部思考/)
  assert.match(feed, /<rss/)
  assert.match(notFound, /页面走丢了/)
})
