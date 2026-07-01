import type { Config } from './types.ts';

const defaults: Config = {
  browserTimeoutMs: 30_000,
  kifliOrigin: 'https://www.kifli.hu',
  port: 8787,
  protocolVersion: '2025-03-26',
  serverName: 'mcpekaru',
  serverVersion: '0.1.0',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    browserTimeoutMs: numberFromEnv(
      env.BROWSER_TIMEOUT_MS,
      defaults.browserTimeoutMs,
    ),
    kifliOrigin: env.KIFLI_ORIGIN ?? defaults.kifliOrigin,
    port: numberFromEnv(env.PORT, defaults.port),
    protocolVersion: env.MCP_PROTOCOL_VERSION ?? defaults.protocolVersion,
    serverName: env.MCP_SERVER_NAME ?? defaults.serverName,
    serverVersion: env.MCP_SERVER_VERSION ?? defaults.serverVersion,
  };
}

export const config = loadConfig();

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : fallback;
}
