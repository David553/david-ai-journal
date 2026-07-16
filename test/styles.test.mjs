import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('article media stays responsive on narrow screens', async () => {
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8')

  assert.match(css, /\.prose img\s*\{[^}]*max-width:\s*100%/s)
  assert.match(css, /\.prose img\s*\{[^}]*height:\s*auto/s)
})

test('audio player has a mobile-friendly listening panel', async () => {
  const css = await readFile(new URL('../public/styles.css', import.meta.url), 'utf8')

  assert.match(css, /\.listen-panel/)
  assert.match(css, /\.listen-panel audio/)
  assert.match(css, /\.prose pre\s*\{[^}]*overflow-x:\s*auto/s)
  assert.match(css, /\.prose pre code\s*\{[^}]*white-space:\s*pre-wrap/s)
  assert.match(css, /\.prose pre code\s*\{[^}]*overflow-wrap:\s*anywhere/s)
})
