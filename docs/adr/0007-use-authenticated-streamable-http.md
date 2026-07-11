# 0007 - Use Authenticated Streamable HTTP

Date: 2026-07-10

Status: Accepted

## Context

The server is moving from local clients to a private ChatGPT integration hosted on
Deno Deploy. The legacy SSE session transport and direct RPC endpoint are
unauthenticated, depend on in-memory session affinity, and do not match ChatGPT's
current remote MCP connection shape.

ChatGPT discovers authentication through MCP protected-resource metadata and uses an
OAuth 2.1 authorization-code flow with PKCE. Auth0 can provide that flow on its free
tier while Deno Deploy provides a stable HTTPS runtime.

## Decision

Supersede the transport decisions in ADR 0001. Expose one stateless Streamable HTTP
endpoint at `POST /mcp` and remove `/sse`, `/messages`, and `/rpc`.

Use Auth0 as the authorization server. Publish OAuth protected-resource metadata,
challenge unauthenticated requests with `WWW-Authenticate`, and verify each bearer
token's RS256 signature, issuer, audience, expiry, activation time, and `kifli:read`
scope before MCP dispatch.

Keep the runtime compatible with both current Node.js and Deno. Use platform APIs and
small local modules instead of an application framework or an OAuth SDK.

## Consequences

The server can be connected to ChatGPT and deployed without session affinity on Deno
Deploy. Authentication requires Auth0 tenant configuration and three deployment
values: issuer, server-origin audience, and public MCP URL.

Signing keys are discovered from Auth0 and cached per runtime instance. The
implementation supports the current read-only tools and intentionally does not
provide a general OAuth client or authorization server.
