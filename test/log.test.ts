import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authFailure } from '../src/auth/rejection.ts';
import { createLog } from '../src/log.ts';
import { errorInfo } from '../src/shared/errors.ts';
import type { LogEntry } from '../src/types.ts';

test('logger emits structured entries through its sink', () => {
  const entries: LogEntry[] = [];
  const log = createLog(
    (entry) => entries.push(entry),
    () => new Date('2026-07-15T00:00:00.000Z'),
  );
  log.info('started', { port: 8787 });
  log.warn('rejected', { reason: 'Missing scope' });
  log.error('failed');
  assert.deepEqual(entries, [
    {
      time: '2026-07-15T00:00:00.000Z',
      level: 'info',
      event: 'started',
      port: 8787,
    },
    {
      time: '2026-07-15T00:00:00.000Z',
      level: 'warn',
      event: 'rejected',
      reason: 'Missing scope',
    },
    {
      time: '2026-07-15T00:00:00.000Z',
      level: 'error',
      event: 'failed',
    },
  ]);
});

test('logging helpers normalize unknown failures', async () => {
  const reject = async () => {
    throw 'rejected';
  };
  assert.equal(await authFailure(reject, 'token'), 'Token rejected');
  assert.deepEqual(errorInfo('failed'), { message: 'Unknown error' });
});

test('default logger writes JSON through level-matched console methods', () => {
  const originals = {
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  const output: string[] = [];
  console.info = (value) => output.push(`info:${value}`);
  console.warn = (value) => output.push(`warn:${value}`);
  console.error = (value) => output.push(`error:${value}`);
  try {
    const log = createLog(
      undefined,
      () => new Date('2026-07-15T00:00:00.000Z'),
    );
    log.info('ready');
    log.warn('careful');
    log.error('failed');
  } finally {
    console.info = originals.info;
    console.warn = originals.warn;
    console.error = originals.error;
  }
  assert.deepEqual(output, [
    `info:${JSON.stringify({
      time: '2026-07-15T00:00:00.000Z',
      level: 'info',
      event: 'ready',
    })}`,
    `warn:${JSON.stringify({
      time: '2026-07-15T00:00:00.000Z',
      level: 'warn',
      event: 'careful',
    })}`,
    `error:${JSON.stringify({
      time: '2026-07-15T00:00:00.000Z',
      level: 'error',
      event: 'failed',
    })}`,
  ]);
  assert.deepEqual(JSON.parse(output[0]!.slice('info:'.length)), {
    time: '2026-07-15T00:00:00.000Z',
    level: 'info',
    event: 'ready',
  });
});
