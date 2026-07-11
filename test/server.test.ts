import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { loadConfig } from '../src/config.ts';
import { createMcpRequestHandler } from '../src/server.ts';

const settings = loadConfig({
  AUTH0_AUDIENCE: 'https://mcp.example/mcp',
  AUTH0_ISSUER: 'https://auth.example',
  MCP_URL: 'https://mcp.example/mcp',
});
const accept = async () => ({ exp: 1 });

test('serves protected resource metadata', async () => {
  const handler = createMcpRequestHandler({}, settings, accept);
  const response = await request(handler, {
    url: '/.well-known/oauth-protected-resource',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(response.json, {
    resource: 'https://mcp.example/mcp',
    authorization_servers: ['https://auth.example/'],
    scopes_supported: ['kifli:read'],
  });
});

test('accepts authenticated MCP requests and notifications', async () => {
  const handler = createMcpRequestHandler({}, settings, accept);
  const listed = await request(handler, {
    url: '/mcp',
    method: 'POST',
    authorization: 'Bearer good',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(listed.status, 200);
  assert.equal(
    (listed.json as { result: { tools: unknown[] } }).result.tools.length,
    2,
  );

  const notified = await request(handler, {
    url: '/mcp',
    method: 'POST',
    authorization: 'bearer good',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  });
  assert.equal(notified.status, 202);
  assert.equal(notified.body, '');
});

test('rejects missing and invalid access tokens', async () => {
  const reject = async () => {
    throw new Error('no');
  };
  const handler = createMcpRequestHandler({}, settings, reject);
  for (const authorization of [undefined, 'Basic value', 'Bearer bad']) {
    const response = await request(handler, {
      url: '/mcp',
      method: 'POST',
      authorization,
      body: '{}',
    });
    assert.equal(response.status, 401);
    assert.match(response.headers['WWW-Authenticate'], /kifli:read/);
  }
});

test('rejects old endpoints, unsupported methods, and invalid JSON', async () => {
  const handler = createMcpRequestHandler({}, settings, accept);
  assert.equal((await request(handler, { url: '/rpc' })).status, 404);
  const method = await request(handler, { url: '/mcp' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.Allow, 'POST');
  const invalid = await request(handler, {
    url: '/mcp',
    method: 'POST',
    authorization: 'Bearer good',
    body: '{',
  });
  assert.equal(invalid.status, 400);
});

test('reports unexpected server failures as HTTP 500', async () => {
  const broken = { ...settings, mcpUrl: 'not a URL' };
  const handler = createMcpRequestHandler({}, broken, accept);
  const response = await request(handler, { url: '/mcp', method: 'POST' });
  assert.equal(response.status, 500);
  assert.match((response.json as { error: string }).error, /Invalid URL/);
});

test('returns tool failures through MCP over HTTP 200', async () => {
  const handler = createMcpRequestHandler(
    {
      async search() {
        throw new Error('Kifli timed out');
      },
    },
    settings,
    accept,
  );
  const response = await request(handler, {
    url: '/mcp',
    method: 'POST',
    authorization: 'Bearer good',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'kifli.search', arguments: { query: 'tej' } },
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    (response.json as { result: { isError: boolean } }).result.isError,
    true,
  );
});

async function request(
  handler: ReturnType<typeof createMcpRequestHandler>,
  options: {
    url: string;
    method?: string;
    authorization?: string;
    body?: string;
  },
) {
  const req = Readable.from(
    options.body ? [options.body] : [],
  ) as IncomingMessage;
  req.method = options.method ?? 'GET';
  req.url = options.url;
  req.headers = { authorization: options.authorization };
  const response = {
    status: 0,
    headers: {} as Record<string, string>,
    body: '',
    writeHead(status: number, headers: Record<string, string>) {
      this.status = status;
      this.headers = headers;
    },
    end(value = '') {
      this.body += value;
    },
  };
  await handler(req, response as unknown as ServerResponse);
  return {
    ...response,
    json: response.body ? (JSON.parse(response.body) as unknown) : undefined,
  };
}
