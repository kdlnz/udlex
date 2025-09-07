#!/usr/bin/env node
// Generate per-article JSON files for the search page and an index from articles/articles.json
// Usage: node scripts/generate-search-json.js [--from-html]
// Options:
//   --from-html   Parse article HTML files under articles/categories/* to extract metadata instead of reading articles/articles.json

const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const articlesJsonPath = path.join(workspaceRoot, 'articles', 'articles.json');
const outDir = path.join(workspaceRoot, 'articles', 'search');

const args = process.argv.slice(2);
const fromHtml = args.includes('--from-html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadArticles() {
  if (fromHtml) return loadFromHtml();
  const raw = fs.readFileSync(articlesJsonPath, 'utf8');
  return JSON.parse(raw);
}

function loadFromHtml() {
  // Scan articles/categories/*/*.html for article metadata
  const categoriesDir = path.join(workspaceRoot, 'articles', 'categories');
  if (!fs.existsSync(categoriesDir)) return [];
  const result = [];
  const cats = fs.readdirSync(categoriesDir);
  for (const c of cats) {
    const catDir = path.join(categoriesDir, c);
    if (!fs.statSync(catDir).isDirectory()) continue;
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.html'));
    for (const f of files) {
      const filePath = path.join(catDir, f);
      const raw = fs.readFileSync(filePath, 'utf8');
      const meta = extractMetaFromHtml(raw);
      if (meta) {
        // populate slug and category from filesystem path so links can be built
        meta.__sourcePath = filePath;
        meta.category = meta.category || c;
        meta.slug = meta.slug || f.replace(/\.html?$/i, '');
        result.push(meta);
      }
    }
  }
  return result;
}

function extractMetaFromHtml(html) {
  // improved extraction: title (<h1>), meta description, JSON-LD Article, author, tags, date
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?\>/i);
  const authorMeta = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']\s*\/?\>/i);
  const tagMeta = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']\s*\/?\>/i);
  const categoryMeta = html.match(/<meta\s+name=["']category["']\s+content=["']([^"']+)["']\s*\/?\>/i);
  // JSON-LD may contain a structured Article object
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  let ld = null;
  if (ldMatch) {
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
  }

  let date = null;
  let author = null;
  let tags = [];
  let a_category = null;

  if (ld) {
    if (ld.datePublished) date = ld.datePublished;
    // JSON-LD may include articleSection or genre which represent category
    if (ld.articleSection) {
      if (Array.isArray(ld.articleSection)) a_category = ld.articleSection[0];
      else a_category = ld.articleSection;
    }
    if (!a_category && ld.genre) a_category = ld.genre;
    if (ld.author) {
      if (typeof ld.author === 'string') author = ld.author;
      else if (ld.author.name) author = ld.author.name;
    }
    if (ld.keywords) {
      if (Array.isArray(ld.keywords)) tags = ld.keywords;
      else if (typeof ld.keywords === 'string') tags = ld.keywords.split(/,\s*/);
    }
  }

  if (!author && authorMeta) author = authorMeta[1].trim();
  if (tagMeta && tags.length === 0) tags = tagMeta[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
  // fallback: look for an inline "Tags: ..." paragraph (e.g. <p class="meta">Tags: a, b, c</p>)
  if (tags.length === 0) {
    const inlineTags = html.match(/Tags:\s*([^<]+)</i);
    if (inlineTags && inlineTags[1]) {
      tags = inlineTags[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    }
  }
  // category from meta if present
  if (categoryMeta) a_category = categoryMeta[1].trim();
  // fallback: try to find from page breadcrumbs or elements like .category
  if (!a_category) {
    const bread = html.match(/class=["']breadcrumbs?["'][^>]*>([\s\S]*?)<\/nav>/i);
    if (bread) {
      const m = bread[1].match(/>([^<>]+)</);
      if (m) a_category = m[1].trim();
    }
  }

  // Try to parse author from inline meta paragraph: "Published DATE | Written by NAME" or "By NAME"
  if (!author) {
    const metaLine = html.match(/<p[^>]*class=["']meta["'][^>]*>([\s\S]*?)<\/p>/i);
    if (metaLine && metaLine[1]) {
      const byMatch = metaLine[1].match(/Written by\s+([^<|]+)|By\s+([^<|]+)/i);
      if (byMatch) author = (byMatch[1] || byMatch[2] || '').trim();
    }
  }

  const title = titleMatch ? titleMatch[1].trim() : (ld && (ld.headline || ld.name)) || null;
  const description = descMatch ? descMatch[1].trim() : (ld && ld.description) || '';
  if (!title) return null;

  return { title, date, author, tags, category: a_category, excerpt: description, seo: { title, description } };
}

function sanitizeArticle(a) {
  return {
    title: a.title,
    slug: a.slug,
    category: a.category,
  tags: a.tags || [],
    date: a.date,
    excerpt: a.excerpt || '',
    seo: a.seo || {}
  };
}

function writePerArticle(articles) {
  ensureDir(outDir);
  const index = [];
  // build categories list from filesystem folders under articles/categories
  const categoriesDir = path.join(workspaceRoot, 'articles', 'categories');
  let categoryList = [];
  if (fs.existsSync(categoriesDir)) {
    categoryList = fs.readdirSync(categoriesDir).filter(n => fs.statSync(path.join(categoriesDir, n)).isDirectory());
    try { fs.writeFileSync(path.join(workspaceRoot, 'articles', 'categories.json'), JSON.stringify(categoryList, null, 2), 'utf8'); } catch (e) { /* ignore */ }
  }
  for (const a of articles) {
    // Ensure we have slug and category. If articles were loaded from HTML without slug/category, try to infer.
    if (!a.slug && a.__sourcePath) {
      // extract from filename: .../categories/<category>/<slug>.html
      const parts = a.__sourcePath.replace(/\\/g, '/').split('/');
      const idx = parts.indexOf('categories');
      if (idx !== -1 && parts.length > idx + 2) {
        a.category = a.category || parts[idx + 1];
        const file = parts[parts.length - 1];
        a.slug = file.replace(/\.html?$/i, '');
      }
    }
    const obj = sanitizeArticle(a);
    // include optional fields
    if (a.author) obj.author = a.author;
    const filename = path.join(outDir, a.slug + '.json');
    fs.writeFileSync(filename, JSON.stringify(obj, null, 2), 'utf8');
    index.push({ title: obj.title, slug: obj.slug, category: obj.category, date: obj.date, excerpt: obj.excerpt, tags: obj.tags, author: obj.author });
  }
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  console.log('Wrote', articles.length, 'article json files to', outDir);
}

function main() {
  try {
    const articles = loadArticles();
    writePerArticle(articles);
  } catch (err) {
    console.error('Error generating search JSON:', err);
    process.exit(1);
  }
}

main();
