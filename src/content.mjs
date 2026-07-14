import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

const requiredFields = ['title', 'date', 'summary']

export function parsePost(filename, source) {
  const { data, content } = matter(source)
  const missing = requiredFields.filter((field) => !data[field])
  if (missing.length > 0) {
    throw new Error(`Post metadata requires title, date and summary; missing: ${missing.join(', ')}`)
  }

  const date = data.date instanceof Date
    ? data.date.toISOString().slice(0, 10)
    : String(data.date).slice(0, 10)

  return {
    slug: filename.replace(/\.md$/i, ''),
    title: String(data.title),
    date,
    summary: String(data.summary),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    html: markdown.render(content),
  }
}
