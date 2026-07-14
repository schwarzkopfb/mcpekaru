# 0010 - Use Structured Runtime Logging

Date: 2026-07-15

Status: Accepted

## Context

OAuth and MCP connection failures currently produce no deployment diagnostics. The
server returns safe HTTP errors but discards token-validation reasons and does not
record request outcomes or unexpected exceptions.

Logging directly throughout feature code would make later terminal formatting,
deployment controls, or external log delivery difficult to introduce consistently.

## Decision

Add a small shared logger with `info`, `warn`, and `error` methods. Each method accepts
an event name and flat structured fields. The default sink writes newline-delimited
JSON to stderr; callers can inject another sink through the same interface.

Log completed HTTP requests, safe authentication rejection reasons, server startup,
and unexpected request failures. Never log bearer tokens, authorization headers,
request bodies, or URL query strings.

## Consequences

Deno Deploy receives useful searchable diagnostics without a dependency or logging
service. Local output is machine-oriented for now. Future formatting, filtering, and
third-party delivery can replace the sink without changing logging call sites.
