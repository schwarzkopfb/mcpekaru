import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../src/config.ts';

test('loadConfig uses defaults when environment values are absent', () => {
  assert.deepEqual(loadConfig({}), {
    authAudience: 'https://mcpekaru.example',
    authIssuer: 'https://example.auth0.com/',
    authScope: 'kifli:read',
    kifliOrigin: 'https://www.kifli.hu',
    kifliTimeoutMs: 10000,
    mcpUrl: 'https://mcpekaru.example/mcp',
    port: 8787,
    protocolVersion: '2025-03-26',
    serverName: 'mcpekaru',
    serverVersion: '0.1.0',
  });
});

test('loadConfig prefers environment values', () => {
  assert.deepEqual(
    loadConfig({
      AUTH0_AUDIENCE: 'https://audience.test/mcp',
      AUTH0_ISSUER: 'https://issuer.test/',
      AUTH_SCOPE: 'products:read',
      KIFLI_ORIGIN: 'https://example.test',
      KIFLI_TIMEOUT_MS: '2500',
      MCP_URL: 'https://server.test/mcp',
      MCP_PROTOCOL_VERSION: 'test-protocol',
      MCP_SERVER_NAME: 'test-server',
      MCP_SERVER_VERSION: '9.9.9',
      PORT: '9999',
    }),
    {
      authAudience: 'https://audience.test/mcp',
      authIssuer: 'https://issuer.test/',
      authScope: 'products:read',
      kifliOrigin: 'https://example.test',
      kifliTimeoutMs: 2500,
      mcpUrl: 'https://server.test/mcp',
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
