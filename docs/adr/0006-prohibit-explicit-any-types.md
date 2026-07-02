# 0006 - Prohibit Explicit Any Types

Date: 2026-07-02

Status: Accepted

## Context

The MCP server exchanges dynamic JSON at protocol and Kifli API boundaries, but using
TypeScript's `any` type hides those boundary decisions and weakens tests. The project
already models uncertain JSON as `unknown` in shared protocol types, then narrows data
inside feature modules.

## Decision

Do not use explicit `any` types in source or tests. When data is dynamic, accept it as
`unknown`, define a specific local or shared type for the shape being inspected, and
narrow or assert at that boundary.

Enforce this policy with ESLint's `@typescript-eslint/no-explicit-any` rule over
TypeScript files under `src/` and `test/`.

## Consequences

Tests need small shape types for JSON-RPC payloads and HTTP mocks instead of broad
casts. Dynamic external data remains supported, but code has to name the expected
shape before reading fields from it.

The project now has a lint step and development-only lint dependencies. This adds
tooling weight, but keeps type-policy enforcement in the tool designed for source
rules instead of encoding it as a unit test.
