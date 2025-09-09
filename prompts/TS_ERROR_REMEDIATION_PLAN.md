# TypeScript Error Remediation Plan and Reusable Prompt

This document provides a concrete plan to drive the repository to a clean TypeScript build, plus a reusable prompt you can paste into an AI/code assistant to execute the plan.

## Current context

- The union type error in `src/server/eventsRouteV2.ts` was fixed by normalizing `status` to the `EventListItemV2['status']` union via `normalizeStatus()` inside `eventsListHandlerV2()`.
- Source of incoming status is `src/services/EventServiceV2.ts` where `OrgEvent.data.status` is typed as `string`. You can either normalize at the edge (what we did) or strengthen upstream types.

## Detailed remediation plan

1) **Establish a deterministic diagnostic baseline**

- Install dependencies:
  - `npm ci`
- Clean and typecheck server and client code:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npx tsx --typecheck src/server/server.ts`
- Build the app:
  - `npm run build`
- Run tests:
  - `npm run test`
- Optional (docs and storybook, if relevant):
  - `npm run docs:build`
  - `npm run sb:build`

2) **Audit TypeScript config for consistency**

Open `tsconfig.json` and verify:

- `compilerOptions.module`: `ESNext`
- `compilerOptions.target`: `ES2020` (or later, matching Vite config)
- `compilerOptions.moduleResolution`: `NodeNext` (or `Bundler` if your Vite stack is set up that way)
- `compilerOptions.jsx`: `react-jsx`
- `compilerOptions.strict`: `true` (preferably)
- `compilerOptions.isolatedModules`: `true` (helps Vite/tsc/tsx consistency)
- `compilerOptions.resolveJsonModule`: `true`
- `compilerOptions.allowJs`: `false` (unless you need mixed JS/TS)
- `include`: ensure it contains directories you want typed (e.g., `src`, `netlify`, `website`)
- `exclude`: ensure it excludes `coverage`, `dist`, `build`, `node_modules`

Align `vite.config.ts` for ESM and React JSX settings. If using Node ESM (`package.json` has `"type": "module"`), prefer `moduleResolution: NodeNext` to avoid import issues on server code.

3) **Triage and fix common error categories**

- **Status unions and string narrowing**
  - Files: `src/server/eventsRouteV2.ts` (fixed), `src/services/EventServiceV2.ts`.
  - Option A: Keep normalizers where data crosses boundaries.
  - Option B: Strengthen upstream types to use the exact union: set `OrgEvent.data.status` to `'draft' | 'scheduled' | 'active' | 'completed' | 'archived'`.

- **Optional/undefined property safety**
  - Add guards when reading from `?.`.
  - Provide defaults only where business logic allows.

- **Mismatched shapes between domain and API DTOs**
  - Create adapter mappers at the route/service boundary so server responses strictly match public interfaces (e.g., `EventListItemV2`).

- **Date type normalization**
  - Standardize on `string` in DTOs (ISO 8601) and convert from/to `Date` objects only at the edges.

- **Express types for params/query**
  - When accessing `req.params` and `req.query`, assert or define typed types:
    - `const { orgSlug, huntId } = req.params as { orgSlug: string; huntId: string }`
    - `const status = req.query.status as EventListItemV2['status'] | undefined`

- **ESM/CJS import mismatches**
  - Ensure default vs named imports match package typings and tsconfig module settings.

- **Any/unknown leakage**
  - Replace `any` with explicit generics or `unknown` + runtime validation when ingesting external data.

- **Align Zod schemas with TS types**
  - Ensure `src/types/*.ts` and `src/schemas/*` represent the same shapes. If schemas evolve, update types or infer with `z.infer<typeof Schema>` to stay in sync.

- **Server/browser boundary**
  - Avoid importing Node-only modules into client bundles and vice versa. Confirm files imported under `src/` client code don’t import server-only code.

4) **Strengthen upstream types where safe**

If you trust `EventServiceV2` inputs, update:

- In `src/services/EventServiceV2.ts`, change `status?: string` to `status?: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'`.
- Update any adapter that might feed nonconforming statuses; otherwise, keep normalizers at the edges.

5) **Add quality gates**

- Add a script for typecheck to `package.json`:
  - `"typecheck": "tsc -p tsconfig.json --noEmit"`
- Add CI to run:
  - `npm ci`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test`
- Optionally add ESLint + tseslint for static analysis to catch issues earlier.

6) **Verify end-to-end**

- Re-run: `npm run typecheck`
- Re-run: `npm run build`
- Re-run: `npm run test`
- Spin up locally: `npm run start` and validate critical flows.

---

## Reusable AI/code assistant prompt

Paste this prompt into your AI/code assistant to systematically find and fix all errors. It is structured and explicit so the assistant can execute autonomously.

```
You are assisting on a TypeScript project using Vite (React), an Express server, and ESM ("type": "module"). Your objective is to eliminate all TypeScript errors and produce a clean build and test run.

Project info:
- package.json scripts include: dev, build, preview, server:dev, test, docs:*, sb:*.
- tsconfig.json exists and should be authoritative for typechecking.

Goals:
1) Run a comprehensive TypeScript typecheck and list all files with errors.
2) Categorize errors by type (union mismatch, undefined access, shape mismatch, ESM/CJS import issue, etc.).
3) Implement minimal, correct fixes that preserve existing behavior and domain invariants.
4) Re-run typecheck, build and tests until they pass.

Constraints and rules:
- Do not downgrade type safety. Prefer strengthening upstream types or adding normalization at boundaries.
- Keep DTOs used in routes strictly typed and convert from domain/internal types using mappers.
- Maintain ESM compatibility. Prefer moduleResolution NodeNext or Bundler as applicable.
- For dates in public DTOs, use ISO strings.
- Avoid introducing any. Use explicit unions, generics, or unknown + parsing where appropriate.

Execution steps:
A) Diagnostics
- Run:
  - npx tsc -p tsconfig.json --noEmit
  - npx tsx --typecheck src/server/server.ts
- Return a summary list: file path -> error count -> short descriptions.

B) tsconfig alignment
- Open tsconfig.json and ensure:
  - "module": "ESNext"
  - "target": "ES2020" (or later)
  - "moduleResolution": "NodeNext" (or "Bundler" if that’s already used)
  - "jsx": "react-jsx"
  - "strict": true
  - "isolatedModules": true
  - "resolveJsonModule": true
  - "skipLibCheck": true (optional)
  - include/exclude set correctly for src, netlify, website
- If changed, re-run typecheck and report diff in error set.

C) Fix categories in order of impact
1. Union type mismatches (example: EventListItemV2.status):
   - Either normalize strings at route boundaries or tighten upstream types to a union.
   - If strengthening upstream is risky, add safe normalizers (e.g., normalizeStatus()).
2. Optional/undefined properties:
   - Add guards and defaults only when consistent with the business logic.
3. Interface/DTO shape mismatches:
   - Add mappers at route boundaries to produce exact API shapes, avoiding leaking internal structs.
4. ESM/CJS and import issues:
   - Fix default/named imports per package typings and tsconfig module settings.
5. Date type consistency:
   - Ensure DTOs expose strings and convert from/to Date only at edges.
6. Any/unknown leakage:
   - Replace with accurate types or parsing/validation (zod).

D) Verify
- Re-run:
  - npx tsc -p tsconfig.json --noEmit
  - npm run build
  - npm run test
- Share the final error summary (should be zero).
- Output a concise list of code changes and rationale per file.

Specific known area to consider:
- src/services/EventServiceV2.ts: OrgEvent.data.status is typed as string. Either:
  - Change to a union: 'draft' | 'scheduled' | 'active' | 'completed' | 'archived'
  - Or ensure all downstream consumers normalize. src/server/eventsRouteV2.ts uses normalizeStatus(...) already.

Deliverables:
- Clean tsc, build, and tests.
- A summary of changes made per file.
- Notes on any domain or data source assumptions introduced (e.g., defaulting unknown statuses to 'scheduled').
```

---

## Optional: single-error prompt template

When you want to target one file at a time, you can use:

```
Fix this TypeScript error:
- File: <path>
- Error: <tsc error text>
- Expectation: Implement the minimal change to satisfy the type checker while preserving runtime behavior. If the error crosses boundaries (DTO vs domain), prefer adding a normalizer or typed mapper at the boundary. Don’t introduce any. If a string should be a union, either narrow at the boundary or safely strengthen upstream if all call sites comply. Re-run tsc afterwards and report.
```
