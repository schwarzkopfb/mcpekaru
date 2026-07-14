import { Buffer } from 'node:buffer';
import type { ServerResponse } from 'node:http';

export function mockResponse() {
  const state = {
    status: 0,
    headers: {} as Record<string, string>,
    chunks: [] as Uint8Array[],
  };
  const response = {
    writeHead(status: number, headers: Record<string, string>) {
      state.status = status;
      state.headers = headers;
    },
    end(value?: string | Uint8Array) {
      if (value !== undefined) state.chunks.push(Buffer.from(value));
    },
  } as unknown as ServerResponse;
  return {
    response,
    read() {
      return {
        status: state.status,
        headers: state.headers,
        body: Buffer.concat(state.chunks).toString(),
      };
    },
  };
}
