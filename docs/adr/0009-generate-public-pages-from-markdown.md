# 0009 - Generate Public Pages From Markdown

Date: 2026-07-14

Status: Accepted

## Context

The public registry pages need consistent presentation while their policy and support
content should remain easy to read and edit. Hand-maintaining repeated HTML would
mix content with layout and make small changes unnecessarily noisy.

## Decision

Keep public page sources as Markdown in `pages/`. Add a `nub run build` task that
uses the development-only `marked` package to generate same-named HTML files in
`public/` with one shared template and stylesheet.

Commit both Markdown sources and generated assets so Deno Deploy can start directly
from `src/server.ts` without running a build step. The build supports the standard
document elements provided by Markdown and intentionally adds no site framework or
client-side JavaScript.

## Consequences

Page content has one source of truth and every generated page has the same layout,
navigation, metadata, and styling. Contributors must run `nub run build` after
editing `pages/` and commit the generated HTML. `marked` is installed only for local
development and deployment continues to have no added runtime dependency.
