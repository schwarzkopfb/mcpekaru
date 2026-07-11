import { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { JsonRpcRequest } from '../types.ts';

export async function readRequest(
  req: IncomingMessage,
): Promise<JsonRpcRequest> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
