import { Buffer } from 'node:buffer';
import { isRecord } from '../shared/values.ts';
import type {
  AuthDependencies,
  Config,
  TokenCheck,
  TokenClaims,
} from '../types.ts';

type Jwk = JsonWebKey & { kid?: string };

export function tokenCheck(
  config: Config,
  deps: AuthDependencies = {},
): TokenCheck {
  const get = deps.fetch ?? fetch;
  const now = deps.now ?? (() => Date.now() / 1000);
  let keys: Jwk[] | undefined;

  return async (token) => {
    const [head, body, signature] = token.split('.');
    if (!head || !body || !signature) throw new Error('Malformed token');
    const header = decode(head);
    const claims = decode(body) as TokenClaims;
    if (header.alg !== 'RS256' || typeof header.kid !== 'string')
      throw new Error('Unsupported token');
    keys ??= await loadKeys(get, config.authIssuer);
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      keys = await loadKeys(get, config.authIssuer);
      jwk = keys.find((key) => key.kid === header.kid);
    }
    if (!jwk) throw new Error('Unknown signing key');
    await verify(jwk, `${head}.${body}`, signature);
    checkClaims(claims, config, now());
    return claims;
  };
}

async function loadKeys(get: typeof fetch, issuer: string): Promise<Jwk[]> {
  const response = await get(`${issuer}.well-known/jwks.json`);
  if (!response.ok) throw new Error('Could not load signing keys');
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.keys))
    throw new Error('Invalid signing keys');
  return body.keys.filter(isRecord) as Jwk[];
}

async function verify(
  jwk: JsonWebKey,
  value: string,
  signature: string,
): Promise<void> {
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { hash: 'SHA-256', name: 'RSASSA-PKCS1-v1_5' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    fromBase64(signature),
    new TextEncoder().encode(value),
  );
  if (!valid) throw new Error('Invalid token signature');
}

function checkClaims(claims: TokenClaims, config: Config, now: number): void {
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const scopes = [
    ...(claims.scope?.split(' ') ?? []),
    ...(claims.permissions ?? []),
  ];
  if (claims.iss !== config.authIssuer) throw new Error('Invalid issuer');
  if (!audience.includes(config.authAudience))
    throw new Error('Invalid audience');
  if (typeof claims.exp !== 'number' || claims.exp <= now)
    throw new Error('Expired token');
  if (typeof claims.nbf === 'number' && claims.nbf > now)
    throw new Error('Inactive token');
  if (!scopes.includes(config.authScope)) throw new Error('Missing scope');
}

function decode(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(
    new TextDecoder().decode(fromBase64(value)),
  );
  if (!isRecord(parsed)) throw new Error('Invalid token JSON');
  return parsed;
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array([...Buffer.from(value, 'base64url')]);
}
