import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const postsDir = path.join(root, 'content/posts')
const scriptsDir = path.join(root, 'audio-scripts/video-training-infra')
const audioDir = path.join(root, 'public/audio')

test('video training infra course is designed for audio-first learning', async () => {
  const files = (await readdir(postsDir))
    .filter((name) => /^2026-07-24-video-training-infra-\d{2}-.+\.md$/.test(name))
  assert.equal(files.length, 10)

  for (const file of files) {
    const post = await readFile(path.join(postsDir, file), 'utf8')
    const slug = file.replace(/\.md$/, '')
    const script = await readFile(path.join(scriptsDir, `${slug}.txt`), 'utf8')
    const mp3 = await stat(path.join(audioDir, `${slug}.mp3`))

    assert.ok(post.includes('tags: [视频生成, 训练 Infra, 数据管线, 算法原理]'), `${file} missing focused tags`)
    assert.match(post, new RegExp(`audio: "/audio/${slug}\\.mp3"`), `${file} missing audio metadata`)
    assert.ok(post.includes('## 开车听这一节'), `${file} missing audio-first section`)
    assert.ok(post.includes('## 项目参照'), `${file} missing project references`)
    assert.ok(script.length >= 3200, `${file} audio script is too short`)
    assert.ok(script.includes('你现在不用看屏幕'), `${file} script is not listenable`)
    assert.ok(mp3.size > 6_000_000, `${file} mp3 too small for a 15-minute-style lesson`)
  }
})
