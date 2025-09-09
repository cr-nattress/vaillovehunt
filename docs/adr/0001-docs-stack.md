# 1. Documentation Stack (MADR)

Date: 2025-09-08

## Status
Accepted

## Context
We need a low-maintenance documentation system covering narrative docs, components, API reference, and decision records.

## Decision
- Docusaurus for MDX docs with local search
- Storybook for component docs with prop tables
- TypeDoc for API reference from TSDoc
- GitHub Actions to guard builds and links

## Consequences
- Contributors can preview docs locally (`docs:dev`, `sb:dev`).
- CI ensures docs stay healthy on PRs.
- Minimal additional dependencies, reusing Vite/React.
