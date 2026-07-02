import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createMcpRequestHandler } from '../src/server.ts';

test('HTTP handler supports rpc, sse messages, and 404s', async () => {
  const handler = createMcpRequestHandler({
    async search(query) {
      return [{ id: query, name: 'Result' }];
    },
  });

  const rpc = await request(handler, {
    url: '/rpc',
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(rpc.status, 200);
  const rpcJson = rpc.json as { result: { tools: unknown[] } };
  assert.equal(rpcJson.result.tools.length, 2);

  const missing = await request(handler, { url: '/missing' });
  assert.equal(missing.status, 404);

  const sse = await request(handler, { url: '/sse' });
  const endpoint = /data: (.+)\n/.exec(sse.writes[0])?.[1] ?? '';
  assert.match(endpoint, /^\/messages\?sessionId=/);

  const posted = await request(handler, {
    url: endpoint,
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'x',
      method: 'tools/call',
      params: { name: 'kifli.search', arguments: { query: 'alma' } },
    }),
  });
  assert.equal(posted.status, 202);
  assert.match(sse.writes[1], /"id":"x"/);
});

test('HTTP handler rejects unknown SSE sessions and invalid JSON', async () => {
  const handler = createMcpRequestHandler();
  const response = await request(handler, {
    url: '/messages?sessionId=nope',
    method: 'POST',
    body: '{}',
  });
  assert.equal(response.status, 404);
  const invalid = await request(handler, {
    url: '/rpc',
    method: 'POST',
    body: '{',
  });
  assert.equal(invalid.status, 500);
});

async function request(
  handler: ReturnType<typeof createMcpRequestHandler>,
  options: { url: string; method?: string; body?: string },
) {
  const req = Readable.from(
    options.body ? [options.body] : [],
  ) as IncomingMessage;
  req.method = options.method ?? 'GET';
  req.url = options.url;
  const response = {
    status: 0,
    headers: {},
    body: '',
    writes: [] as string[],
    writeHead(status: number, headers: Record<string, string>) {
      this.status = status;
      this.headers = headers;
    },
    write(value: string) {
      this.writes.push(value);
    },
    end(value = '') {
      this.body += value;
    },
    on() {
      return this;
    },
  };
  await handler(req, response as unknown as ServerResponse);
  return {
    ...response,
    json: response.body ? (JSON.parse(response.body) as unknown) : undefined,
  };
}
