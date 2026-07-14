import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PublicFile, PublicFiles } from '../types.ts';
import { mime } from './public_mime.ts';

const publicRoot = fileURLToPath(new URL('../../public', import.meta.url));

export function loadPublic(root = publicRoot): PublicFiles {
  const files = new Map<string, PublicFile>();
  if (!existsSync(root)) return files;
  scan(root, root, files);
  for (const [route, file] of [...files]) addAliases(files, route, file);
  return files;
}

function scan(root: string, dir: string, files: Map<string, PublicFile>): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) scan(root, path, files);
    if (entry.isFile()) {
      const route = `/${relative(root, path).split('\\').join('/')}`;
      files.set(route, { body: readFileSync(path), type: mime(path) });
    }
  }
}

function addAliases(
  files: Map<string, PublicFile>,
  route: string,
  file: PublicFile,
): void {
  if (!route.endsWith('.html')) return;
  add(files, route.slice(0, -5) || '/', file);
  if (posix.basename(route) !== 'index.html') return;
  const dir = posix.dirname(route);
  add(files, dir === '/' ? '/' : `${dir}/`, file);
  if (dir !== '/') add(files, dir, file);
}

function add(
  files: Map<string, PublicFile>,
  route: string,
  file: PublicFile,
): void {
  if (!files.has(route)) files.set(route, file);
}
