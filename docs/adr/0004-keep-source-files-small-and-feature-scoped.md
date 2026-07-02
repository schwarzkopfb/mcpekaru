# 0004 - Keep Source Files Small and Feature Scoped

Date: 2026-07-02

Status: Accepted

## Context

The project started with a few top-level modules, which made the runtime easy to
scan while the MCP surface was tiny. As Kifli parsing and MCP schemas grew, files
started to mix URL construction, fetching, extraction, orchestration, schema
metadata, and JSON-RPC response formatting.

The project benefits from keeping the minimal Node.js architecture while making
feature boundaries more explicit and files easier to read.

## Decision

Organize source by feature subfolders under `src/` when a top-level module grows
past one clear responsibility. Keep thin top-level compatibility modules such as
`src/kifli.ts` and `src/mcp.ts` when they provide stable import points.

Prefer files under 100 source lines of code. If a file exceeds that target, it
should contain one cohesive object, function, or schema; otherwise split it by
responsibility before adding more behavior.

## Consequences

Kifli API URL construction, fetching, product URL handling, search parsing,
detail parsing, and detail lookup can evolve independently. MCP request
handling, tool metadata, schemas, response helpers, and tool execution have
separate ownership.

There are more files, but each file has a narrower reason to change. Future
restructuring should preserve stable public entrypoints unless there is a
specific reason to change imports across the project.
