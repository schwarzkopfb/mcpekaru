import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleMcpRequest } from '../src/mcp.ts';

type JsonSchema = {
  type?: string;
  required?: string[];
  properties: Record<string, JsonSchema>;
  additionalProperties?: JsonSchema | false;
  items?: JsonSchema;
};

type ToolMetadata = {
  annotations: {
    readOnlyHint: boolean;
    openWorldHint: boolean;
    destructiveHint: boolean;
  };
  outputSchema: JsonSchema;
};

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
  const tools = (list?.result as { tools: ToolMetadata[] }).tools;
  assert.equal(tools.length, 2);
  const readOnlyAnnotations = {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
  };
  assert.deepEqual(tools[0].annotations, readOnlyAnnotations);
  assert.deepEqual(tools[1].annotations, readOnlyAnnotations);
  assert.deepEqual(tools[0].outputSchema.required, ['products']);
  assert.equal(tools[0].outputSchema.properties.products.type, 'array');
  assert.deepEqual(tools[1].outputSchema.required, [
    'id',
    'name',
    'attributes',
  ]);
  const attributeAdditionalProperties =
    tools[1].outputSchema.properties.attributes.additionalProperties;
  assert.ok(attributeAdditionalProperties);
  assert.notEqual(attributeAdditionalProperties, false);
  assert.equal(attributeAdditionalProperties.type, 'string');
});
