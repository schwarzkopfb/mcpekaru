import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import { tokenCheck } from '../src/auth/jwt.ts';
import { loadConfig } from '../src/config.ts';

const settings = loadConfig({
  AUTH0_AUDIENCE: 'https://mcp.example/mcp',
  AUTH0_ISSUER: 'https://auth.example',
});
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key-1' };

test('verifies Auth0 access tokens and caches signing keys', async () => {
  let calls = 0;
  const check = tokenCheck(settings, {
    now: () => 100,
    fetch: async () => {
      calls += 1;
      return Response.json({ keys: [jwk] });
    },
  });
  const token = makeToken({
    aud: ['other', settings.authAudience],
    exp: 200,
    iss: settings.authIssuer,
    nbf: 50,
    scope: `other ${settings.authScope}`,
  });
  assert.equal((await check(token)).iss, settings.authIssuer);
  await check(token);
  assert.equal(calls, 1);
});

test('reloads signing keys after Auth0 rotates them', async () => {
  let calls = 0;
  const check = tokenCheck(settings, {
    now: () => 100,
    fetch: async () => Response.json({ keys: calls++ ? [jwk] : [] }),
  });
  await check(
    makeToken({
      aud: settings.authAudience,
      exp: 200,
      iss: settings.authIssuer,
      permissions: [settings.authScope],
    }),
  );
  assert.equal(calls, 2);
});

test('rejects malformed tokens and invalid headers', async () => {
  const check = verifier();
  await rejects(check('short'));
  await rejects(check(makeToken({}, { alg: 'ES256', kid: 'key-1' })));
  await rejects(check(makeToken({}, { alg: 'RS256' })));
  await rejects(check(makeToken({}, { alg: 'RS256', kid: 'missing' })));
  await rejects(check('e30.e30.bad'));
});

test('rejects invalid token claims', async () => {
  const base = {
    aud: settings.authAudience,
    exp: 200,
    iss: settings.authIssuer,
    scope: settings.authScope,
  };
  for (const claims of [
    { ...base, iss: 'wrong' },
    { ...base, aud: 'wrong' },
    { ...base, exp: 100 },
    { ...base, exp: undefined },
    { ...base, nbf: 101 },
    { ...base, scope: 'wrong' },
    { ...base, scope: undefined },
    { ...base, permissions: [], scope: undefined },
  ])
    await rejects(verifier()(makeToken(claims)));
});

test('rejects unavailable or malformed signing keys', async () => {
  await rejects(
    tokenCheck(settings, {
      fetch: async () => new Response('', { status: 500 }),
    })(makeToken({})),
  );
  await rejects(
    tokenCheck(settings, { fetch: async () => Response.json({}) })(
      makeToken({}),
    ),
  );
});

function verifier() {
  return tokenCheck(settings, {
    now: () => 100,
    fetch: async () => Response.json({ keys: [jwk] }),
  });
}

function makeToken(
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'RS256', kid: 'key-1' },
): string {
  const head = encode(header);
  const body = encode(claims);
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(`${head}.${body}`),
    privateKey,
  );
  return `${head}.${body}.${signature.toString('base64url')}`;
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function rejects(value: Promise<unknown>): Promise<void> {
  await assert.rejects(value);
}
