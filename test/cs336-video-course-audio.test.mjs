import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const postsDir = path.join(root, 'content/posts')
const scriptsDir = path.join(root, 'audio-scripts/cs336')
const audioDir = path.join(root, 'public/audio')

test('cs336 video course has long audio-first Chinese lessons', async () => {
  const files = (await readdir(postsDir))
    .filter((name) => /^2026-07-17-cs336-video-\d{2}-.+\.md$/.test(name))
  assert.equal(files.length, 17)

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const post = await readFile(path.join(postsDir, file), 'utf8')
    const script = await readFile(path.join(scriptsDir, `${slug}.txt`), 'utf8')
    const mp3 = await stat(path.join(audioDir, `${slug}.mp3`))

    assert.ok(post.includes('## 中文讲解'), `${file} missing Chinese explanation`)
    assert.match(post, new RegExp(`audio: "/audio/${slug}\\.mp3"`), `${file} missing audio metadata`)
    assert.ok(script.length >= 3200, `${file} audio script is too short`)
    assert.ok(script.includes('你现在不用看屏幕'), `${file} script is not audio-first`)
    assert.ok(mp3.size > 9_000_000, `${file} mp3 too small for a long lesson`)
  }
})
