import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const postsDir = path.join(root, 'content/posts')

test('university course lessons are substantial Chinese course notes', async () => {
  const files = (await readdir(postsDir))
    .filter((name) => /^2026-07-17-(cs324-foundation-models|cos597g-llm-research|cs336-from-scratch)-\d{2}-.+\.md$/.test(name))
  assert.equal(files.length, 24)

  for (const file of files) {
    const content = await readFile(path.join(postsDir, file), 'utf8')
    assert.ok(content.length >= 5000, `${file} is too short`)
    for (const heading of [
      '## 先建立直觉',
      '## 核心机制',
      '## 一个可手算的小例子',
      '## 工程/研究判断',
      '## 常见误区',
      '## 练习',
      '## 延伸阅读',
    ]) {
      assert.ok(content.includes(heading), `${file} missing ${heading}`)
    }
  }
})
