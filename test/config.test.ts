import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../src/config';

test('loadConfig uses defaults when environment values are absent', () => {
  assert.deepEqual(loadConfig({}), {
    kifliOrigin: 'https://www.kifli.hu',
    port: 8787,
    protocolVersion: '2025-03-26',
    serverName: 'mcpekaru',
    serverVersion: '0.1.0',
  });
});

test('loadConfig prefers environment values', () => {
  assert.deepEqual(
    loadConfig({
      KIFLI_ORIGIN: 'https://example.test',
      MCP_PROTOCOL_VERSION: 'test-protocol',
      MCP_SERVER_NAME: 'test-server',
      MCP_SERVER_VERSION: '9.9.9',
      PORT: '9999',
    }),
    {
      kifliOrigin: 'https://example.test',
      port: 9999,
      protocolVersion: 'test-protocol',
      serverName: 'test-server',
      serverVersion: '9.9.9',
    },
  );
});

test('loadConfig falls back for invalid numeric values', () => {
  assert.equal(loadConfig({ PORT: 'NaN' }).port, 8787);
});
