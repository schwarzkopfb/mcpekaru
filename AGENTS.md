# Repository Guidelines

## Project Structure & Module Organization

This is a minimal Node.js/TypeScript MCP server that streams model responses over SSE. Put source in `src/` and tests in `test/`.

```text
src/          MCP server, SSE transport, config, types, Kifli scraping
test/         Node.js built-in test files
docs/adr/     Architectural Decision Records
package.json  nub scripts and dependency declarations
lock.yaml     nub lockfile
```

Keep modules small: isolate MCP registration, SSE, Kifli search scraping, and product-detail extraction. Put shared types in `src/types.ts`; do not define reusable exported types in feature modules. Read config through `src/config.ts`, which loads env vars first, then defaults.

## Architectural Decision Records

Before planning or implementing changes, read all ADRs in `docs/adr/` to understand accepted architectural constraints and tradeoffs. Keep implementation consistent with accepted ADRs unless the task explicitly changes the decision; in that case, add a new ADR that supersedes the older record instead of editing history.

Create a new ADR whenever a significant change is implemented. Significant changes include adding or removing MCP tools, changing the transport/API shape, introducing dependencies or runtime requirements, changing the Kifli extraction strategy, altering configuration/security behavior, or restructuring module boundaries.

Use sequential filenames such as `0002-add-example-tool.md`. Each ADR should include:

- `# NNNN - Title`
- `Date`
- `Status` (`Accepted`, `Superseded`, or `Proposed`)
- `Context`
- `Decision`
- `Consequences`

Keep ADRs concise and concrete. Record the decision and its project-specific tradeoffs; do not use ADRs for implementation notes that belong in code or tests.

## Build, Test, and Development Commands

Use latest Node.js with TypeScript through `nub.js`. Do not require `npm` or separate `tsc` precompile.

```sh
nub run dev    # Run the local MCP server
nub run test   # Run node:test with 100% coverage thresholds
nub run check  # Syntax-check TypeScript without emitting output
nub run format # Format all files with Prettier
```

Do not add runners, bundlers, transpilers, or wrappers unless they reduce code.

## Coding Style & Naming Conventions

Follow YAGNI: implement only current MCP commands and extraction. Prefer Node core modules. Add packages through `nub.js` only when impractical. Kifli data access uses direct JSON API requests through Node's built-in `fetch`.

Format every file with Prettier. Use `camelCase` for variables/functions, `PascalCase` for types/classes, and `snake_case` for files. Keep TypeScript strict at public boundaries.

## MCP & Kifli Behavior

Expose MCP commands for Kifli product search and product detail lookup. Search should call Kifli's data APIs, extract results, and include a stable SKU/product ID. Detail lookup accepts that ID or a Kifli product URL, fetches direct product data, and streams results over SSE.

Return minimal, model-friendly JSON. Avoid raw HTML unless needed for debugging.

## Testing Guidelines

All committed code must maintain 100% test coverage. Use Node’s built-in `node:test` through `nub.js` under `test/`. Prefer deterministic unit tests for parsing and command behavior. Mock fetch boundaries where practical; mark live Kifli tests as integration coverage.

Test names should describe behavior, for example `search-extracts-product-ids.test.ts`.

## Commit & Pull Request Guidelines

No Git history is available, so use short imperative commit subjects such as `Add Kifli search command`. Keep commits focused.

Pull requests should include the MCP commands changed, verification commands, coverage result, and notes for any Kifli API response shape changes.

## Security & Configuration Tips

Do not commit secrets or local `.env` files. Keep Kifli requests polite and avoid unnecessary API calls.
