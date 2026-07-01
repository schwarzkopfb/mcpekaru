import { randomUUID } from 'node:crypto';
import {
  type IncomingMessage,
  type RequestListener,
  type Server,
  type ServerResponse,
  createServer,
} from 'node:http';
import { config } from './config';
import { handleMcpRequest } from './mcp';
import { open, send } from './sse';
import type { JsonRpcRequest, McpDependencies, Session } from './types';

export function createMcpHttpServer(deps: McpDependencies = {}): Server {
  return createServer(createMcpRequestHandler(deps));
}

export function createMcpRequestHandler(
  deps: McpDependencies = {},
): RequestListener {
  const sessions = new Map<string, Session>();
  return async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/sse')
        return connectSse(res, sessions);
      if (req.method === 'POST' && req.url?.startsWith('/messages'))
        return await receiveMessage(req, res, sessions, deps);
      if (req.method === 'POST' && req.url === '/rpc')
        return await receiveRpc(req, res, deps);
      return notFound(res);
    } catch (error) {
      return json(res, 500, {
        error: error instanceof Error ? error.message : 'Internal error',
      });
    }
  };
}

export function listen(port = config.port): Server {
  return createMcpHttpServer().listen(port, () => {
    process.stderr.write(
      `${config.serverName} listening on http://localhost:${port}/sse\n`,
    );
  });
}

function connectSse(res: ServerResponse, sessions: Map<string, Session>): void {
  const sessionId = randomUUID();
  open(res);
  sessions.set(sessionId, { res });
  res.on('close', () => sessions.delete(sessionId));
  send(res, 'endpoint', `/messages?sessionId=${sessionId}`);
}

async function receiveMessage(
  req: IncomingMessage,
  res: ServerResponse,
  sessions: Map<string, Session>,
  deps: McpDependencies,
): Promise<void> {
  const session = sessions.get(
    new URL(req.url ?? '', 'http://localhost').searchParams.get('sessionId') ??
      '',
  );
  if (!session) return json(res, 404, { error: 'Unknown SSE session' });
  const response = await handleMcpRequest(await readJson(req), deps);
  if (response) send(session.res, 'message', response);
  return json(res, 202, { accepted: true });
}

async function receiveRpc(
  req: IncomingMessage,
  res: ServerResponse,
  deps: McpDependencies,
): Promise<void> {
  const response = await handleMcpRequest(await readJson(req), deps);
  return json(res, 200, response ?? { accepted: true });
}

async function readJson(req: IncomingMessage): Promise<JsonRpcRequest> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function json(res: ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function notFound(res: ServerResponse): void {
  json(res, 404, { error: 'Not found' });
}

/* node:coverage ignore next */
if (process.argv[1] === new URL(import.meta.url).pathname) listen();
