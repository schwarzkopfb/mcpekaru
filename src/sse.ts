import type { ServerResponse } from 'node:http';

export function encode(event: string, data: unknown): string {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${body}\n\n`;
}

export function open(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
}

export function send(res: ServerResponse, event: string, data: unknown): void {
  res.write(encode(event, data));
}
