import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpDependencies,
} from '../types.ts';
import { fail, ok } from './responses.ts';
import { serverInfo } from './server_info.ts';
import { callTool } from './tool_calls.ts';
import { tools } from './tools.ts';

export async function handleMcpRequest(
  request: JsonRpcRequest,
  deps: McpDependencies = {},
): Promise<JsonRpcResponse | undefined> {
  const id = request.id ?? null;
  if (request.method === 'notifications/initialized') return undefined;
  if (request.method === 'initialize') return ok(id, serverInfo());
  if (request.method === 'tools/list') return ok(id, { tools });
  if (request.method === 'tools/call')
    return callTool(id, request.params, deps);
  return fail(id, -32601, `Unknown method: ${request.method}`);
}
