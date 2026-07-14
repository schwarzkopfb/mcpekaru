import { type RequestListener, type Server, createServer } from 'node:http';
import { tokenCheck } from './auth/jwt.ts';
import { authMetadata } from './auth/metadata.ts';
import { config } from './config.ts';
import { readRequest } from './http/body.ts';
import { loadPublic, servePublic } from './http/public.ts';
import { empty, json } from './http/replies.ts';
import { handleMcpRequest } from './mcp.ts';
import type {
  Config,
  McpDependencies,
  PublicFiles,
  TokenCheck,
} from './types.ts';

const publicFiles = loadPublic();

export function createMcpHttpServer(deps: McpDependencies = {}): Server {
  return createServer(createMcpRequestHandler(deps));
}

export function createMcpRequestHandler(
  deps: McpDependencies = {},
  settings: Config = config,
  check: TokenCheck = tokenCheck(settings),
  files: PublicFiles = publicFiles,
): RequestListener {
  return async (req, res) => {
    try {
      if (
        req.method === 'GET' &&
        req.url === '/.well-known/oauth-protected-resource'
      )
        return json(res, 200, authMetadata(settings));
      if (req.url !== '/mcp') return servePublic(req, res, files);
      if (req.method !== 'POST') return empty(res, 405, { Allow: 'POST' });
      const token = bearer(req.headers.authorization);
      if (!token || !(await allowed(check, token)))
        return unauthorized(res, settings);
      let request;
      try {
        request = await readRequest(req);
      } catch (error) {
        return json(res, 400, {
          error: error instanceof Error ? error.message : 'Bad request',
        });
      }
      const response = await handleMcpRequest(request, deps);
      return response ? json(res, 200, response) : empty(res, 202);
    } catch (error) {
      return json(res, 500, {
        error: error instanceof Error ? error.message : 'Internal error',
      });
    }
  };
}

export function listen(port = config.port): Server {
  return createMcpHttpServer().listen(port, () => {
    process.stderr.write(`${config.serverName} listening on port ${port}\n`);
  });
}

function bearer(value: string | undefined): string | undefined {
  const match = /^Bearer (\S+)$/i.exec(value ?? '');
  return match?.[1];
}

async function allowed(check: TokenCheck, token: string): Promise<boolean> {
  try {
    await check(token);
    return true;
  } catch {
    return false;
  }
}

function unauthorized(res: Parameters<typeof json>[0], settings: Config): void {
  const root = new URL(settings.mcpUrl).origin;
  const metadata = `${root}/.well-known/oauth-protected-resource`;
  json(
    res,
    401,
    { error: 'Unauthorized' },
    {
      'WWW-Authenticate': `Bearer resource_metadata="${metadata}", scope="${settings.authScope}"`,
    },
  );
}

/* node:coverage ignore next */
if (process.argv[1] === new URL(import.meta.url).pathname) listen();
