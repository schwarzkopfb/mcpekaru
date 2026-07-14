# 0008 - Cache Public Files at Startup

Date: 2026-07-14

Status: Accepted

## Context

The ChatGPT plugin registry requires public website, support, privacy, and terms
pages alongside the protected MCP endpoint. These assets change only when a new
application revision is deployed.

Resolving request paths against the filesystem would add repeated I/O and create an
avoidable path-traversal boundary in the request lifecycle.

## Decision

Recursively scan the repository's `public` folder once when the server starts. Load
regular, non-hidden files into an in-memory route table with content types and add
extensionless aliases for HTML files plus directory aliases for `index.html`.

Match API routes before public routes. Public requests use decoded, validated URL
keys only and never become filesystem paths. Missing routes use cached `404.html`
content when available, otherwise a plain `not found` response.

## Consequences

Public requests require no filesystem access after startup and work consistently on
Node.js and Deno Deploy. Asset changes require a restart or deployment. Memory usage
grows with the total size of `public`, so the folder should contain only small plugin
pages and resources.
