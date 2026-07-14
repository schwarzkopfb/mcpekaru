# mcpekaru

A small authenticated MCP server that lets ChatGPT search products on kifli.hu.

## Configuration

Create an Auth0 API with the `kifli:read` permission, using the public server origin as
its identifier. In Auth0's advanced tenant settings, enable Dynamic Client
Registration and the Resource Parameter Compatibility Profile. Configure
`kifli:read` as a default permission for third-party applications, create your own
user, and disable public sign-up.

Set these values locally and in Deno Deploy:

```sh
AUTH0_ISSUER=https://your-tenant.eu.auth0.com/
AUTH0_AUDIENCE=https://your-app.deno.net
MCP_URL=https://your-app.deno.net/mcp
AUTH_SCOPE=kifli:read
KIFLI_TIMEOUT_MS=10000
```

`AUTH0_AUDIENCE` must equal the Auth0 API identifier and should be the server origin.
`MCP_URL` is the full public MCP endpoint. `AUTH_SCOPE` is optional and defaults to
`kifli:read`. `KIFLI_TIMEOUT_MS` is optional and defaults to ten seconds.

## Run

```sh
nub run build
nub run dev
nub run test
nub run check
nub run deno:check
```

All tasks live in `package.json`, with `nub` as the primary runner. Deno can also
resolve those scripts through `deno task <name>` when needed; there is no separate
Deno task configuration.

On Deno Deploy, select `src/server.ts` as the entrypoint and add the environment
variables as secrets. Then create a developer-mode plugin in ChatGPT using the public
`/mcp` URL. Add the callback URL shown by ChatGPT to Auth0's allowed callback URLs.

## Public pages

Registry page sources live under `pages/`. Run `nub run build` after changing them to
generate the matching HTML files under `public/`; generated pages share
`public/style.css`.

Files under `public/` are loaded into memory when the server starts. HTML files are
also available without the `.html` extension, and nested `index.html` files serve
their directory route. Missing routes use `public/404.html` when present.

## Logging

The server writes newline-delimited JSON logs to stderr for startup, completed HTTP
requests, authentication rejections, and unexpected failures. Logs intentionally
exclude bearer tokens, authorization headers, request bodies, and query strings.
