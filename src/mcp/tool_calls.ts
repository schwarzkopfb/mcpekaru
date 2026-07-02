import { getKifliProductDetails, searchKifli } from '../kifli.ts';
import { isRecord } from '../shared/values.ts';
import type { JsonRpcResponse, McpDependencies } from '../types.ts';
import { fail, ok, toolResult } from './responses.ts';

export async function callTool(
  id: string | number | null,
  params: unknown,
  deps: McpDependencies,
): Promise<JsonRpcResponse> {
  if (!isRecord(params) || typeof params.name !== 'string')
    return fail(id, -32602, 'Tool name is required');
  const args = isRecord(params.arguments) ? params.arguments : {};
  if (params.name === 'kifli.search') return callSearchTool(id, args, deps);
  if (params.name === 'kifli.productDetails')
    return callDetailsTool(id, args, deps);
  return fail(id, -32602, `Unknown tool: ${params.name}`);
}

async function callSearchTool(
  id: string | number | null,
  args: Record<string, unknown>,
  deps: McpDependencies,
): Promise<JsonRpcResponse> {
  const products = await (deps.search ?? searchKifli)(
    requiredString(args.query, 'query'),
  );
  return ok(id, toolResult(products, { products }));
}

async function callDetailsTool(
  id: string | number | null,
  args: Record<string, unknown>,
  deps: McpDependencies,
): Promise<JsonRpcResponse> {
  const details = await (deps.details ?? getKifliProductDetails)(
    requiredString(args.id, 'id'),
  );
  return ok(id, toolResult(details, details));
}

function requiredString(value: unknown, name: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  throw new Error(`${name} must be a non-empty string`);
}
