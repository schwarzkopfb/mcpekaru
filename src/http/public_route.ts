import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PublicFile, PublicFiles } from '../types.ts';

export function servePublic(
  req: IncomingMessage,
  res: ServerResponse,
  files: PublicFiles,
): void {
  const route = safePath(req.url);
  const file = route ? files.get(route) : undefined;
  const fallback = files.get('/404.html');
  if (file) return send(res, req.method === 'HEAD', 200, file);
  if (fallback) return send(res, req.method === 'HEAD', 404, fallback);
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(req.method === 'HEAD' ? undefined : 'not found');
}

function safePath(url: string | undefined): string | undefined {
  try {
    const path = decodeURIComponent((url ?? '/').split('?')[0]);
    const parts = path.split('/');
    if (
      !path.startsWith('/') ||
      parts.some(
        (part) =>
          part === '.' ||
          part === '..' ||
          part.startsWith('.') ||
          part.includes('\\') ||
          part.includes('\0'),
      )
    )
      return undefined;
    return path;
  } catch {
    return undefined;
  }
}

function send(
  res: ServerResponse,
  head: boolean,
  status: number,
  file: PublicFile,
): void {
  res.writeHead(status, {
    'Content-Length': String(file.body.byteLength),
    'Content-Type': file.type,
  });
  res.end(head ? undefined : file.body);
}
