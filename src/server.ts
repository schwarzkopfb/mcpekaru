import { type RequestListener, type Server, createServer } from 'node:http';
import { tokenCheck } from './auth/jwt.ts';
import { authMetadata } from './auth/metadata.ts';
import { authFailure } from './auth/rejection.ts';
import { config } from './config.ts';
import { readRequest } from './http/body.ts';
import { loadPublic, servePublic } from './http/public.ts';
import { empty, json } from './http/replies.ts';
import { trace } from './http/trace.ts';
import { log } from './log.ts';
import { handleMcpRequest } from './mcp.ts';
import { errorInfo } from './shared/errors.ts';
import type {
  Config,
  Logger,
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
  logger: Logger = log,
): RequestListener {
  return async (req, res) => {
    trace(req, res, logger);
    try {
      if (
        req.method === 'GET' &&
        req.url === '/.well-known/oauth-protected-resource'
      )
        return json(res, 200, authMetadata(settings));
      if (req.url !== '/mcp') return servePublic(req, res, files);
      if (req.method !== 'POST') return empty(res, 405, { Allow: 'POST' });
      const token = bearer(req.headers.authorization);
      const reason = token
        ? await authFailure(check, token)
        : 'Missing bearer token';
      if (reason) {
        logger.warn('auth_rejected', { path: '/mcp', reason });
        return unauthorized(res, settings);
      }
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
      logger.error('request_failed', errorInfo(error));
      return json(res, 500, {
        error: error instanceof Error ? error.message : 'Internal error',
      });
    }
  };
}

export function listen(port = config.port): Server {
  return createMcpHttpServer().listen(port, () => {
    log.info('server_started', { name: config.serverName, port });
  });
}

function bearer(value: string | undefined): string | undefined {
  const match = /^Bearer (\S+)$/i.exec(value ?? '');
  return match?.[1];
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
