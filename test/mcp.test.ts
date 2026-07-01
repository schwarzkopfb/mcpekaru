import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleMcpRequest } from '../src/mcp.ts';

test('handleMcpRequest initializes and lists tools', async () => {
  const init = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
  });
  assert.equal(
    (init?.result as Record<string, unknown>).protocolVersion,
    '2025-03-26',
  );

  const list = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  });
  assert.equal((list?.result as { tools: unknown[] }).tools.length, 2);
});

test('handleMcpRequest dispatches Kifli tools', async () => {
  const search = await handleMcpRequest(
    {
      jsonrpc: '2.0',
      id: 's',
      method: 'tools/call',
      params: { name: 'kifli.search', arguments: { query: 'tej' } },
    },
    {
      async search(query) {
        return [{ id: query, name: 'Tej' }];
      },
    },
  );
  assert.equal(
    JSON.parse((search?.result as any).content[0].text)[0].id,
    'tej',
  );

  const details = await handleMcpRequest(
    {
      jsonrpc: '2.0',
      id: 'd',
      method: 'tools/call',
      params: { name: 'kifli.productDetails', arguments: { id: 'SKU' } },
    },
    {
      async details(id) {
        return { id, name: 'Tej', attributes: {} };
      },
    },
  );
  assert.equal(JSON.parse((details?.result as any).content[0].text).id, 'SKU');
});

test('handleMcpRequest reports protocol errors', async () => {
  assert.equal(
    await handleMcpRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
    undefined,
  );
  assert.equal(
    (await handleMcpRequest({ jsonrpc: '2.0', method: 'missing' }))?.error
      ?.code,
    -32601,
  );
  assert.equal(
    (
      await handleMcpRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {},
      })
    )?.error?.code,
    -32602,
  );
  assert.equal(
    (
      await handleMcpRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'x' },
      })
    )?.error?.message,
    'Unknown tool: x',
  );
  await assert.rejects(
    () =>
      handleMcpRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'kifli.search', arguments: { query: '' } },
      }),
    /query must/,
  );
});
