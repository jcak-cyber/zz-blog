import { promises as fs } from 'fs';
import * as path from 'path';
import { parseMarkdownDocument } from '../src/modules/posts/markdown/frontmatter';

async function main() {
  const apiBase = process.env.API_BASE ?? 'http://localhost:4000/api/v1';
  const token = process.env.IMPORT_TOKEN ?? 'dev-import-token';
  const contentDir = path.resolve(__dirname, '../../../content/posts');

  const entries = await fs.readdir(contentDir);
  const mdFiles = entries.filter((f) => f.endsWith('.md'));
  const items = [];

  for (const file of mdFiles) {
    const raw = await fs.readFile(path.join(contentDir, file), 'utf8');
    const parsed = parseMarkdownDocument(raw);
    items.push({
      title: parsed.title,
      slug: parsed.slug,
      content: parsed.content,
      excerpt: parsed.excerpt,
      cover: parsed.cover,
      published: parsed.published,
      date: parsed.date,
      tags: parsed.tags,
    });
  }

  const res = await fetch(`${apiBase}/posts/import`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-import-token': token,
    },
    body: JSON.stringify({ items }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error(body);
    process.exit(1);
  }
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
