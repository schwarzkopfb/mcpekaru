import { config } from './config.ts';
import { getKifliProductDetails, searchKifli } from './kifli.ts';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpDependencies,
} from './types.ts';

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

const tools = [
  {
    name: 'kifli.search',
    description:
      'Search kifli.hu products and return names, URLs, and SKU/product IDs.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: { query: { type: 'string' } },
    },
  },
  {
    name: 'kifli.productDetails',
    description:
      'Fetch detailed kifli.hu product information by SKU, product ID, or URL.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
  },
];

async function callTool(
  id: string | number | null,
  params: unknown,
  deps: McpDependencies,
): Promise<JsonRpcResponse> {
  if (!isRecord(params) || typeof params.name !== 'string')
    return fail(id, -32602, 'Tool name is required');
  const args = isRecord(params.arguments) ? params.arguments : {};
  if (params.name === 'kifli.search')
    return ok(
      id,
      toolResult(
        await (deps.search ?? searchKifli)(requiredString(args.query, 'query')),
      ),
    );
  if (params.name === 'kifli.productDetails')
    return ok(
      id,
      toolResult(
        await (deps.details ?? getKifliProductDetails)(
          requiredString(args.id, 'id'),
        ),
      ),
    );
  return fail(id, -32602, `Unknown tool: ${params.name}`);
}

function serverInfo(): unknown {
  return {
    protocolVersion: config.protocolVersion,
    capabilities: { tools: {} },
    serverInfo: { name: config.serverName, version: config.serverVersion },
  };
}

function toolResult(value: unknown): unknown {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

function requiredString(value: unknown, name: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  throw new Error(`${name} must be a non-empty string`);
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function fail(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}
