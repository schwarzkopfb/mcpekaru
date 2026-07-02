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
  const tools = (list?.result as { tools: any[] }).tools;
  assert.equal(tools.length, 2);
  assert.deepEqual(tools[0].outputSchema.required, ['products']);
  assert.equal(tools[0].outputSchema.properties.products.type, 'array');
  assert.deepEqual(tools[1].outputSchema.required, [
    'id',
    'name',
    'attributes',
  ]);
  assert.equal(
    tools[1].outputSchema.properties.attributes.additionalProperties.type,
    'string',
  );
});
