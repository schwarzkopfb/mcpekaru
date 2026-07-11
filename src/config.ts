import type { Config } from './types.ts';

const defaults: Config = {
  authAudience: 'https://mcpekaru.example',
  authIssuer: 'https://example.auth0.com/',
  authScope: 'kifli:read',
  kifliOrigin: 'https://www.kifli.hu',
  kifliTimeoutMs: 10_000,
  mcpUrl: 'https://mcpekaru.example/mcp',
  port: 8787,
  protocolVersion: '2025-03-26',
  serverName: 'mcpekaru',
  serverVersion: '0.1.0',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    authAudience: env.AUTH0_AUDIENCE ?? defaults.authAudience,
    authIssuer: withSlash(env.AUTH0_ISSUER ?? defaults.authIssuer),
    authScope: env.AUTH_SCOPE ?? defaults.authScope,
    kifliOrigin: env.KIFLI_ORIGIN ?? defaults.kifliOrigin,
    kifliTimeoutMs: numberFromEnv(
      env.KIFLI_TIMEOUT_MS,
      defaults.kifliTimeoutMs,
    ),
    mcpUrl: env.MCP_URL ?? defaults.mcpUrl,
    port: numberFromEnv(env.PORT, defaults.port),
    protocolVersion: env.MCP_PROTOCOL_VERSION ?? defaults.protocolVersion,
    serverName: env.MCP_SERVER_NAME ?? defaults.serverName,
    serverVersion: env.MCP_SERVER_VERSION ?? defaults.serverVersion,
  };
}

function withSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

export const config = loadConfig();

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : fallback;
}
