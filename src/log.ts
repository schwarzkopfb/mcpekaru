import type { LogFields, LogSink, Logger } from './types.ts';

export function createLog(
  sink: LogSink = write,
  now: () => Date = () => new Date(),
): Logger {
  const emit = (
    level: 'info' | 'warn' | 'error',
    event: string,
    fields: LogFields = {},
  ) => sink({ ...fields, time: now().toISOString(), level, event });
  return {
    info: (event, fields) => emit('info', event, fields),
    warn: (event, fields) => emit('warn', event, fields),
    error: (event, fields) => emit('error', event, fields),
  };
}

function write(entry: Parameters<LogSink>[0]): void {
  console[entry.level](JSON.stringify(entry));
}

export const log = createLog();
export const { error, info, warn } = log;
