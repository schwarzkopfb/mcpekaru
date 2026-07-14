import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Logger } from '../types.ts';

export function trace(
  req: IncomingMessage,
  res: ServerResponse,
  logger: Logger,
): void {
  const start = performance.now();
  res.once('finish', () => {
    logger.info('http_request', {
      method: req.method ?? 'UNKNOWN',
      path: (req.url ?? '/').split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
    });
  });
}
