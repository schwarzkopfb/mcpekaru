import type { JsonRpcResponse } from '../types.ts';

export function ok(
  id: string | number | null,
  result: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

export function fail(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

export function toolResult(
  value: unknown,
  structuredContent: unknown,
): unknown {
  return {
    content: [{ type: 'text', text: JSON.stringify(value) }],
    structuredContent,
  };
}
