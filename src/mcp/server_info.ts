import { config } from '../config.ts';

export function serverInfo(): unknown {
  return {
    protocolVersion: config.protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: config.serverName, version: config.serverVersion },
  };
}
