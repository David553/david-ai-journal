import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { parsePost } from './content.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteUrl = process.env.SITE_URL || 'http://124.223.202.120:8088'

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const formatDate = (date) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
}).format(new Date(`${date}T12:00:00+08:00`))

function layout({ title, description, content, pageClass = '' }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#11120f">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="David · 思考生长中">
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="${pageClass}">
  <div class="signal-field" aria-hidden="true"></div>
  <header class="site-header">
    <a class="wordmark" href="/" aria-label="回到首页">
      <span class="wordmark-mark">D<span>·</span>AI</span>
      <span class="wordmark-note">思考生长中</span>
    </a>
    <nav aria-label="主导航">
      <a href="/#notes">文章</a>
      <a href="/#about">关于</a>
      <a class="feed-link" href="/feed.xml">RSS ↗</a>
    </nav>
  </header>
  <main>${content}</main>
  <footer class="site-footer">
    <p>人与 AI 共同整理，判断与责任仍然属于人。</p>
    <p>© ${new Date().getFullYear()} David · Foshan</p>
  </footer>
  <script src="/site.js" defer></script>
</body>
</html>`
}

function homePage(posts) {
  const latest = posts[0]
  const cards = posts.map((post, index) => `
    <article class="note-card reveal" style="--delay:${index * 70}ms">
      <a href="/posts/${encodeURIComponent(post.slug)}/">
        <div class="note-meta"><span>0${posts.length - index}</span><time datetime="${post.date}">${formatDate(post.date)}</time></div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
        <div class="note-foot">
          <span>${post.tags.map((tag) => `#${escapeHtml(tag)}`).join(' · ')}</span>
          <span class="arrow">↗</span>
        </div>
      </a>
    </article>`).join('')

  return layout({
    title: 'David · 思考生长中',
    description: '记录 AI、产品、教育与生活中尚未完成的判断。',
    pageClass: 'home-page',
    content: `
      <section class="hero">
        <div class="hero-kicker reveal">PERSONAL INTELLIGENCE LOG / 2026—</div>
        <h1 class="reveal"><span>记录判断，</span><em>不是记录噪音。</em></h1>
        <div class="hero-bottom reveal">
          <p>这里保存我每天与 AI 对话后，仍然愿意亲自署名的想法。关于产品、教育、技术，以及一个人如何持续更新自己。</p>
          <a class="latest-pulse" href="${latest ? `/posts/${latest.slug}/` : '#notes'}"><i></i> 最近更新 <span>→</span></a>
        </div>
        <div class="orb" aria-hidden="true"><div></div><span>THINK<br>WITH<br>MACHINES</span></div>
      </section>
      <section class="manifesto reveal" aria-label="写作原则">
        <p>AI 负责扩展可能</p><b>×</b><p>我负责作出判断</p><b>×</b><p>时间负责检验答案</p>
      </section>
      <section class="notes-section" id="notes">
        <div class="section-heading reveal"><p>FIELD NOTES</p><h2>近期思考</h2><span>${String(posts.length).padStart(2, '0')} 篇</span></div>
        <div class="notes-grid">${cards || '<p class="empty">第一篇思考正在形成。</p>'}</div>
      </section>
      <section class="about reveal" id="about">
        <div><p class="eyebrow">ABOUT THIS PLACE</p><h2>一块长期主义的<br>数字试验田。</h2></div>
        <div class="about-copy">
          <p>不是资讯搬运，也不是 AI 自动灌水。每篇文字从真实对话和具体问题开始，经过整理、核验和重新表达，最后成为可以被未来的自己反驳或继承的记录。</p>
          <dl><div><dt>关注</dt><dd>AI / 产品 / 教育</dd></div><div><dt>坐标</dt><dd>中国 · 佛山</dd></div><div><dt>节奏</dt><dd>持续更新，不追热点</dd></div></dl>
        </div>
      </section>`,
  })
}

function articlePage(post) {
  return layout({
    title: `${post.title} · David`,
    description: post.summary,
    pageClass: 'article-page',
    content: `
      <article class="article-shell">
        <header class="article-header reveal">
          <a class="back-link" href="/">← 返回全部思考</a>
          <div class="article-meta"><time datetime="${post.date}">${formatDate(post.date)}</time><span>${post.tags.map((tag) => `#${escapeHtml(tag)}`).join(' · ')}</span></div>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="article-deck">${escapeHtml(post.summary)}</p>
        </header>
        <div class="article-rule"><span></span><i></i></div>
        <div class="prose">${post.html}</div>
        <footer class="article-end"><span>END OF NOTE</span><a href="/">继续阅读 →</a></footer>
      </article>`,
  })
}

function notFoundPage() {
  return layout({
    title: '404 · David',
    description: '页面不存在',
    pageClass: 'not-found-page',
    content: '<section class="not-found"><p>404 / SIGNAL LOST</p><h1>页面走丢了。</h1><a href="/">回到有信号的地方 →</a></section>',
  })
}

function rss(posts) {
  const items = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>${siteUrl}/posts/${post.slug}/</link><guid>${siteUrl}/posts/${post.slug}/</guid><pubDate>${new Date(`${post.date}T12:00:00+08:00`).toUTCString()}</pubDate><description>${escapeHtml(post.summary)}</description></item>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>David · 思考生长中</title><link>${siteUrl}</link><description>AI、产品、教育与生活的个人思考</description>${items}</channel></rss>`
}

export async function buildSite({
  postsDir = path.join(root, 'content/posts'),
  outputDir = path.join(root, 'dist'),
  publicDir = path.join(root, 'public'),
} = {}) {
  const filenames = (await readdir(postsDir)).filter((name) => name.endsWith('.md'))
  const posts = await Promise.all(filenames.map(async (filename) => parsePost(filename, await readFile(path.join(postsDir, filename), 'utf8'))))
  posts.sort((a, b) => b.date.localeCompare(a.date))

  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })
  if (publicDir) await cp(publicDir, outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'index.html'), homePage(posts))
  await writeFile(path.join(outputDir, '404.html'), notFoundPage())
  await writeFile(path.join(outputDir, 'feed.xml'), rss(posts))
  for (const post of posts) {
    const articleDir = path.join(outputDir, 'posts', post.slug)
    await mkdir(articleDir, { recursive: true })
    await writeFile(path.join(articleDir, 'index.html'), articlePage(post))
  }
  return posts
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const posts = await buildSite()
  console.log(`Built ${posts.length} post(s) into dist/`)
}
