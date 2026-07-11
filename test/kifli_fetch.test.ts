import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchJson } from '../src/kifli.ts';

test('fetchJson requests JSON with a timeout', async () => {
  const result = await fetchJson('https://example.test', async (_url, init) => {
    assert.equal(init?.headers instanceof Headers, false);
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ ok: true });
  });
  assert.deepEqual(result, { ok: true });
});

test('fetchJson reports upstream status and invalid JSON failures', async () => {
  await assert.rejects(
    fetchJson(
      'https://example.test/fail',
      async () => new Response('', { status: 503 }),
    ),
    /503/,
  );
  await assert.rejects(
    fetchJson(
      'https://example.test/json',
      async () => new Response('not json'),
    ),
    /JSON/,
  );
});
