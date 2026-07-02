import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleMcpRequest } from '../src/mcp.ts';
import type { ProductDetails, ProductSummary } from '../src/types.ts';

type TextContent = {
  text: string;
  type: 'text';
};

type ToolCallResult = {
  content: TextContent[];
  structuredContent: unknown;
};

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
  const searchResult = search?.result as ToolCallResult;
  const searchText = JSON.parse(
    searchResult.content[0].text,
  ) as ProductSummary[];
  assert.equal(searchText[0].id, 'tej');
  assert.deepEqual(searchResult.structuredContent, {
    products: [{ id: 'tej', name: 'Tej' }],
  });

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
  const detailsResult = details?.result as ToolCallResult;
  const detailsText = JSON.parse(
    detailsResult.content[0].text,
  ) as ProductDetails;
  assert.equal(detailsText.id, 'SKU');
  assert.deepEqual(detailsResult.structuredContent, {
    id: 'SKU',
    name: 'Tej',
    attributes: {},
  });
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
