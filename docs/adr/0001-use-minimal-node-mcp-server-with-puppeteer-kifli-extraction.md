# 0001 - Use Minimal Node MCP Server With Puppeteer Kifli Extraction

Date: 2026-07-01

Status: Accepted

## Context

The project is a small Node.js/TypeScript MCP server for Kifli product lookup. It exposes model-friendly tools for product search and product detail lookup, supports streamed MCP interaction over SSE, and keeps parsing logic testable without requiring live Kifli requests in normal unit tests.

The current codebase is intentionally narrow:

- `src/server.ts` owns the Node HTTP server, SSE session lifecycle, `/messages` handling, and `/rpc` handling.
- `src/mcp.ts` owns JSON-RPC/MCP request dispatch and tool metadata.
- `src/kifli.ts` owns Kifli URL construction, Puppeteer browsing, JSON-LD extraction, product-link fallback parsing, and product detail extraction.
- `src/sse.ts` owns SSE encoding and response headers.
- `src/config.ts` centralizes environment-backed configuration with defaults.
- `src/types.ts` contains shared exported types.
- Tests use Node's built-in `node:test` runner and dependency injection around browser and MCP boundaries.

## Decision

Use a minimal Node.js/TypeScript architecture with no application framework, no build step, and no additional transport abstraction beyond the current HTTP endpoints:

- Serve MCP over SSE using `GET /sse` and session-scoped `POST /messages?sessionId=...`.
- Keep `POST /rpc` as a direct JSON-RPC path for simpler local and test clients.
- Register only the current Kifli tools: `kifli.search` and `kifli.productDetails`.
- Use Puppeteer as the browser boundary for Kifli pages because the site may require real browser rendering.
- Prefer structured product data from JSON-LD, then fall back to narrow HTML link or attribute extraction.
- Keep shared public types in `src/types.ts` and inject browser/tool dependencies in tests to preserve deterministic coverage.
- Continue using `nub.js`, Node core modules, Prettier, and Node's built-in test runner rather than adding runners, bundlers, or frameworks.

## Consequences

The server remains easy to inspect, run, and test. Module boundaries are explicit enough for the current MCP surface without adding framework conventions or generated code.

Kifli extraction depends on selectors, URL shapes, and JSON-LD availability from an external site, so parser changes should stay isolated in `src/kifli.ts` and covered with deterministic fixtures. Live browser behavior should remain behind injectable boundaries.

Adding MCP tools, changing transport behavior, adding dependencies, or replacing the extraction approach is an architectural change and should create a follow-up ADR that accepts or supersedes this decision.
