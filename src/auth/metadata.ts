import type { Config } from '../types.ts';

export function authMetadata(config: Config): unknown {
  return {
    resource: config.authAudience,
    authorization_servers: [config.authIssuer],
    scopes_supported: [config.authScope],
  };
}
