# Repository Guidelines

## Project Structure & Module Organization

This is a minimal Node.js/TypeScript MCP server for ChatGPT, deployed on Deno Deploy. It uses Streamable HTTP and Auth0 OAuth. Put source in `src/` and tests in `test/`.

```text
src/          MCP server, config, shared types, and feature folders
src/auth/     Auth0 token verification and OAuth resource metadata
src/http/     Small HTTP body and response helpers
src/kifli/    Kifli API URLs, fetching, product URLs, search and detail parsing
src/mcp/      MCP request handling, tool metadata, schemas, tool calls
src/shared/   Small non-domain helpers shared across feature folders
test/         Node.js built-in test files
docs/adr/     Architectural Decision Records
package.json  nub scripts and dependency declarations
lock.yaml     nub lockfile
```

Keep modules small, atomic, and feature-scoped: isolate authentication, HTTP transport, MCP registration, tool execution, Kifli API URL construction, fetching, search extraction, and product-detail extraction. Use subfolders inside `src/` whenever a top-level module would mix multiple responsibilities. Keep stable top-level entrypoints such as `src/kifli.ts` and `src/mcp.ts` as thin re-export modules when useful for imports.

Prefer files under 100 source lines of code. If a file exceeds that target, it should contain exactly one cohesive object, class, function, or schema; otherwise split it into smaller responsibility-focused modules before adding more behavior. When a single large object is unavoidable, consider whether an ADR or a more explicit architecture would make ownership clearer.

Use short, expressive names. Avoid enterprise-style names, redundant suffixes, and abstractions that only rename one operation. Prefer a small function or module with one obvious purpose over manager, service, provider, factory, or orchestration layers.

Put shared types in `src/types.ts`; do not define reusable exported types in feature modules. Read config through `src/config.ts`, which loads env vars first, then defaults.

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

Use latest Node.js with TypeScript through `nub.js` as the primary project tool. Deno is a deployment target running the Node-compatible application, not a second task system. Keep every task in `package.json` so `nub run <task>` is authoritative and `deno task <task>` can reuse it. Do not add `deno.json`, require `npm`, or add a separate TypeScript precompile.

```sh
nub run dev    # Run the local MCP server
nub run test   # Run node:test with 100% coverage thresholds
nub run check  # Syntax-check TypeScript without emitting output
nub run deno:check # Verify the Deno deployment target
nub run format # Format all files with Prettier
```

Do not add runners, bundlers, transpilers, or wrappers unless they reduce code.

## Coding Style & Naming Conventions

Follow YAGNI: implement only current MCP commands and extraction. Prefer Node core modules. Add packages through `nub.js` only when impractical. Kifli data access uses direct JSON API requests through Node's built-in `fetch`.

Format every file with Prettier. Use `camelCase` for variables/functions, `PascalCase` for types/classes, and `snake_case` for files. Keep TypeScript strict at public boundaries.

Use explicit `.ts` extensions for all local TypeScript imports and re-exports. This matches Node's built-in type stripping behavior; `tsconfig.json` enables `allowImportingTsExtensions` so the TypeScript checker accepts the same specifiers.

## MCP & Kifli Behavior

Expose MCP commands for Kifli product search and product detail lookup. Search should call Kifli's data APIs, extract results, and include a stable SKU/product ID. Detail lookup accepts that ID or a Kifli product URL and fetches direct product data. Expose only the authenticated Streamable HTTP endpoint at `POST /mcp` and OAuth protected-resource metadata. Do not restore legacy `/sse`, `/messages`, or `/rpc` endpoints.

Return minimal, model-friendly JSON. Avoid raw HTML unless needed for debugging.

## Testing Guidelines

All committed code must maintain 100% test coverage. Use Node’s built-in `node:test` through `nub.js` under `test/`. Prefer deterministic unit tests for parsing and command behavior. Mock fetch boundaries where practical; mark live Kifli tests as integration coverage.

Test names should describe behavior, for example `search-extracts-product-ids.test.ts`.

## Commit & Pull Request Guidelines

Follow the Conventional Commits 1.0.0
standard for every commit. Keep commits small, focused, and expressive.

Write the subject in this form:

<type>[optional scope][optional !]: <description>

- Select the appropriate Conventional Commits type, such as feat, fix,
  docs, refactor, test, or chore.
- Keep the entire subject line to 50 characters or fewer.
- Write the description in lowercase and in the imperative mood. It should
  complete the sentence “This commit will …”, for example,
  feat: implement advanced result filtering.
- Do not end the subject with a period.
- Use the specification’s ! marker or BREAKING CHANGE: footer for breaking
  changes.

Separate the subject from the body with a blank line. The body must contain a
short list of the significant changes in the commit and explain what changed
and why. Wrap body lines at 72 characters.

### Development session modes

This repository supports two development session modes:

- physical – commit signing is available.
- remote – commit signing is temporarily unavailable, but local version
  control is still desired during development.

The current mode is stored in the repository-local Git configuration:

git config --get development.sessionMode

Before creating any commit, agents must check the current mode.

#### Physical mode

When the mode is physical:

- Create commits normally:

git commit

- Commits are expected to be cryptographically signed.
- Pushing is permitted after the normal verification process.

#### Remote mode

When the mode is remote:

- Never create commits using git commit.
- Create commits using:

git remote-commit

- git remote-commit intentionally creates unsigned local commits for
  development purposes.
- These commits are considered temporary and must not be pushed or otherwise
  published.
- Do not disable or modify the repository’s signing configuration.
- Do not bypass any local or remote verification mechanisms.

Before publishing work created in remote mode, all unpublished commits must be
rewritten as signed commits using the project’s signing workflow. Only after
that may the branch be pushed.

Pull requests should include the MCP commands changed, verification commands,
coverage result, and notes for any Kifli API response shape changes.

## Security & Configuration Tips

Do not commit secrets or local `.env` files. Keep Kifli requests polite and avoid unnecessary API calls.

Verify Auth0 access-token signatures, issuer, audience, expiry, activation time, and scope on every MCP request. Keep authentication configuration in environment variables and never log bearer tokens.
