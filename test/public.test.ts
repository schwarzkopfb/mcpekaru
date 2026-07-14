import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadPublic, servePublic } from '../src/http/public.ts';
import type { PublicFiles } from '../src/types.ts';
import { mockResponse } from './mocks/http.ts';

const root = fileURLToPath(new URL('fixtures/public', import.meta.url));

test('loadPublic caches exact, HTML, and directory routes', () => {
  const files = loadPublic(root);
  assert.equal(text(files, '/'), 'home\n');
  assert.equal(text(files, '/index.html'), 'home\n');
  assert.equal(text(files, '/about'), 'exact\n');
  assert.equal(text(files, '/about.html'), 'about\n');
  assert.equal(text(files, '/docs'), 'docs\n');
  assert.equal(text(files, '/docs/'), 'docs\n');
  assert.equal(text(files, '/docs/page'), 'page\n');
  assert.equal(files.get('/style.css')?.type, 'text/css; charset=utf-8');
  assert.equal(files.get('/photo.JPG')?.type, 'image/jpeg');
  assert.equal(files.get('/file.bin')?.type, 'application/octet-stream');
  assert.equal(files.has('/.secret'), false);
  assert.equal(loadPublic(join(root, 'missing')).size, 0);
});

test('servePublic returns cached files and HTML fallback', () => {
  const files = new Map([
    ['/page', file('page', 'text/html; charset=utf-8')],
    ['/404.html', file('missing', 'text/html; charset=utf-8')],
  ]);
  const page = serve(files, '/page?from=test');
  assert.equal(page.status, 200);
  assert.equal(page.body, 'page');
  assert.equal(page.headers['Content-Length'], '4');

  const head = serve(files, '/page', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');

  for (const url of [
    '/missing',
    '/../page',
    '/%2e%2e/page',
    '/.secret',
    '/bad\\path',
    '/bad%00path',
    '/%ZZ',
    'relative',
  ]) {
    const missing = serve(files, url);
    assert.equal(missing.status, 404);
    assert.equal(missing.body, 'missing');
  }
  assert.equal(serve(files, '/missing', 'HEAD').body, '');
});

test('servePublic returns plain text without a fallback page', () => {
  const response = serve(new Map(), '/missing');
  assert.equal(response.status, 404);
  assert.equal(response.body, 'not found');
  assert.equal(response.headers['Content-Type'], 'text/plain; charset=utf-8');
  assert.equal(serve(new Map(), '/missing', 'HEAD').body, '');
});

function text(files: PublicFiles, route: string): string | undefined {
  const body = files.get(route)?.body;
  return body ? Buffer.from(body).toString() : undefined;
}

function file(body: string, type: string) {
  return { body: Buffer.from(body), type };
}

function serve(files: PublicFiles, url: string, method = 'GET') {
  const req = { method, url } as IncomingMessage;
  const res = mockResponse();
  servePublic(req, res.response, files);
  return res.read();
}
