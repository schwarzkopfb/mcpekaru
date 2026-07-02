# 0005 - Use Explicit TypeScript Import Extensions

Date: 2026-07-02

Status: Accepted

## Context

The project runs TypeScript directly through Node and `nub.js` without a separate
precompile step. `nub.js` transpilation tolerated both extensionless local imports
and `.ts` imports, but Node's built-in type stripping expects explicit `.ts`
extensions for TypeScript source files.

Mixing both styles made the module graph less clear and created a mismatch between
runtime behavior and the TypeScript checker defaults.

## Decision

Use explicit `.ts` extensions for every local TypeScript import and re-export in
source and tests.

Enable `allowImportingTsExtensions` in `tsconfig.json`, with `noEmit`, so the
TypeScript checker accepts the same import specifiers used by Node's type-stripping
runtime.

## Consequences

Local imports now identify the source file type directly and match the runtime path
Node accepts when running TypeScript files directly.

The project remains no-build: TypeScript checking must not emit JavaScript from
these `.ts` import specifiers.
