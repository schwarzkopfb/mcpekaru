import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = fileURLToPath(new URL('..', import.meta.url));
const pages = join(root, 'pages');
const publicDir = join(root, 'public');
const template = await readFile(join(pages, 'template.html'), 'utf8');
const year = String(new Date().getFullYear());

await mkdir(publicDir, { recursive: true });
for (const entry of await readdir(pages, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const source = await readFile(join(pages, entry.name), 'utf8');
  const title = source.match(/^#\s+(.+)$/m)?.[1] ?? basename(entry.name, '.md');
  const content = await marked.parse(source);
  const output = entry.name.replace(/\.md$/, '.html');
  const page = template
    .replace('<!-- title -->', escape(title))
    .replace('<!-- content -->', content)
    .replace('<!-- year -->', year);
  await writeFile(join(publicDir, output), page);
}

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
