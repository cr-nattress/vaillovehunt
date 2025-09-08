Here’s a copy-paste **prompt template** you can drop into your code assistant (Claude/ChatGPT/Cursor/Windsurf/etc.) while sitting in the **root of an existing React repo**. It audits what’s there, then scaffolds docs with **Docusaurus + Storybook + TypeDoc + ADRs**, wires CI checks, and opens PRs—without turning your repo into a yak salon.

---

# 🔧 Prompt: “Make My React App Properly Documented”

**ROLE:** You are a senior DX engineer. Your job is to add a complete, low-maintenance documentation system to this existing React codebase with minimal disruption.

**GOALS (ranked):**

1. Narrative docs site (MDX) with search and live React snippets.
2. Component docs with prop tables and example states.
3. API reference generated from TSDoc.
4. Architecture Decision Records (ADRs).
5. CI checks that keep docs honest (builds, broken links, story coverage).

**ASSUMPTIONS & ADAPTATION:**

* If the repo already has any of **Docusaurus, Storybook, or TypeDoc**, **reuse & upgrade** instead of duplicating.
* Framework is React; tooling may be Vite or CRA or Next. Detect and adapt.
* Language is TypeScript if present; otherwise add minimal `*.d.ts` where needed.
* Use existing package manager (detect `pnpm-lock.yaml`, `yarn.lock`, or `package-lock.json`).

---

## INPUTS (from repo)

1. Read `package.json`, `tsconfig*`, `vite.config*` or `next.config*`, `/src` and `/packages` if monorepo.
2. Detect story files (`*.stories.*`), existing docs folders, and CI config (GitHub Actions, Netlify/Vercel).
3. Build a short **Doc Plan** summarizing gaps and selected stack.

Return the **Doc Plan** first (≤150 words), then proceed.

---

## ACTION PLAN

1. **Docusaurus (Narrative + MDX)**

   * Create `/docs` folder and seed:

     * `getting-started.mdx`, `project-structure.mdx`, `contributing.mdx`
     * `guides/state-management.mdx` (stub if unknown)
     * `security.md` (basic headers: dependencies, env, CSP)
     * `adr/0001-docs-stack.md` (use MADR format)
   * Add **`/website`** (Docusaurus) or reuse existing. Configure:

     * MDX with React live examples (use `@docusaurus/plugin-content-docs`, `@mdx-js/react`)
     * Search: preset classic with local search or Algolia if `ALGOLIA_*` env present.
     * Link to Storybook and API Reference.
   * Scripts:

     * `"docs:dev": "docusaurus start"`, `"docs:build": "docusaurus build"`, `"docs:serve": "docusaurus serve"`

2. **Storybook (Components)**

   * If missing, init **`storybook`** with React/Vite builder.
   * Add `@storybook/addon-docs` and `react-docgen-typescript-plugin` for prop tables.
   * Enforce at least one story for any public component exported from `/src/components` or `/packages/ui`.
   * Scripts:

     * `"sb:dev": "storybook dev -p 6006"`, `"sb:build": "storybook build"`

3. **TypeDoc (API Reference)**

   * Install and configure **TypeDoc** to read TSDoc from exported APIs.
   * Output to `docs/reference/` (consumed by Docusaurus via docs plugin or static link).
   * Script: `"api:build": "typedoc"`

4. **ADRs**

   * Add ADR index and template.
   * Create initial ADRs for: router choice, state library, build tooling (based on detection).

5. **CI Guardrails**

   * GitHub Actions workflow `.github/workflows/docs.yml` that runs on PR:

     * `pnpm install` (or yarn/npm)
     * `pnpm sb:build`
     * `pnpm api:build`
     * `pnpm docs:build` (fail on broken links)
   * Optional: Netlify/Vercel previews for the docs site and Storybook if config present.

6. **Developer Ergonomics**

   * Add `scripts/new:component` to scaffold `Component.tsx`, `Component.stories.tsx`, and `README.md`.
   * PR template `.github/pull_request_template.md` with checkbox: “📚 Updated docs (Story/MDX/README)”.

---

## FILE CHANGES (create or modify)

* `website/` (Docusaurus app) with `docusaurus.config.ts`, `sidebars.ts`, and docs theme.
* `docs/` content:

  * `/guides/*.mdx`, `/adr/*.md`, `/reference/` (generated)
* `.storybook/` config with `main.ts`, `preview.tsx` and RDT plugin.
* `typedoc.json` (strict, TS-aware paths).
* `.github/workflows/docs.yml`
* `.github/pull_request_template.md`
* `package.json` scripts added (do not remove existing).

**Do not** break existing app build or dev scripts.

---

## CONSTRAINTS

* Keep dependencies minimal and common (no exotic plugins unless needed).
* Do not rename existing packages or move major folders without clear justification.
* All new commands must work with the detected package manager.
* Prefer configuration files in TypeScript when supported.

---

## OUTPUTS

1. **Doc Plan (≤150 words)** confirming stack and changes.
2. A **git patch** (unified diff) for all new/updated files.
3. A **one-page README snippet** that explains how to run Storybook, build API docs, and start the docs site.
4. A **PR description** (Markdown) listing goals, the checks that now run in CI, and manual test steps.

---

## VERIFICATION (run locally)

* `pnpm sb:build` (or yarn/npm) completes with prop tables visible for at least one component.
* `pnpm api:build` generates `docs/reference`.
* `pnpm docs:build` succeeds; no broken links.
* `pnpm docs:dev` shows MDX pages with embedded React examples.

---

## STYLE

* Be surgical: reuse what exists; add the minimum to achieve goals.
* When choosing between multiple viable libs, prefer the one the repo already uses (e.g., Vite).
* Keep comments crisp. No boilerplate novels.

---

## NOW DO THIS

1. Detect the environment and print the **Doc Plan**.
2. If reasonable, proceed to generate the **git patch** implementing the plan.
3. Include the README snippet and PR description.
4. If anything blocks (e.g., monorepo workspaces misconfigured), propose the smallest fix and proceed.

*(If you do this right, future me won’t curse future you. Small win.)*
