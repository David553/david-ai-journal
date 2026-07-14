import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSite } from './build.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT || 4173)
const types = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/rss+xml' }

await buildSite()

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname)
  let target = path.join(dist, pathname)
  if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, 'index.html')
  if (!existsSync(target)) target = path.join(dist, '404.html')
  response.writeHead(target.endsWith('404.html') ? 404 : 200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' })
  createReadStream(target).pipe(response)
}).listen(port, '127.0.0.1', () => console.log(`Blog preview: http://127.0.0.1:${port}`))
