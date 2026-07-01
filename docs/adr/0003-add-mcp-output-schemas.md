# 0003 - Add MCP Output Schemas

Date: 2026-07-02

Status: Accepted

## Context

The MCP server exposes `kifli.search` and `kifli.productDetails` tools. Clients can
call both tools, but without output schemas models have less explicit guidance about
the result shapes.

The tools already return minimal JSON-serializable product data, and MCP supports
`outputSchema` plus `structuredContent` for typed tool results.

## Decision

Add `outputSchema` definitions to both existing Kifli tools. Keep the current text
content JSON for compatibility, and add `structuredContent` that matches the declared
schema.

Represent search structured output as an object with a `products` array. Represent
product detail structured output as the product detail object with dynamic string
attributes.

## Consequences

MCP clients and models can understand the supported result fields without inferring
them from examples or serialized text. Existing clients that read the text content can
continue to do so.

The server now maintains schema definitions alongside the tool registration, so
future changes to returned fields should update tests and schemas together.
