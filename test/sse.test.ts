import assert from 'node:assert/strict';
import type { ServerResponse } from 'node:http';
import { test } from 'node:test';
import { encode, open, send } from '../src/sse.ts';

test('encode formats string and JSON events', () => {
  assert.equal(
    encode('endpoint', '/messages'),
    'event: endpoint\ndata: /messages\n\n',
  );
  assert.equal(
    encode('message', { ok: true }),
    'event: message\ndata: {"ok":true}\n\n',
  );
});

test('open and send write response data', () => {
  const writes: string[] = [];
  const headers: unknown[] = [];
  const res = {
    writeHead(status: number, value: unknown) {
      headers.push(status, value);
    },
    write(value: string) {
      writes.push(value);
    },
  } as unknown as ServerResponse;
  open(res);
  send(res, 'message', { id: 1 });
  assert.equal(headers[0], 200);
  assert.match(
    String((headers[1] as Record<string, string>)['Content-Type']),
    /text\/event-stream/,
  );
  assert.equal(writes[0], 'event: message\ndata: {"id":1}\n\n');
});
