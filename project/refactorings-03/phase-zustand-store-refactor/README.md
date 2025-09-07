# Zustand Store Refactor Plan

This refactor extracts the monolithic `src/store/appStore.ts` into smaller, independently testable units following battle-tested patterns. It also provides a step-by-step, low-risk migration path with explicit prompts you can use for pair-programming or PR guidance.

Use the following documents in this folder:

- PHASES.md — Multi-phase plan with acceptance criteria and rollback notes
- PROMPTS.md — Copy/paste prompts/instructions per phase
- CODE-SKELETONS.md — Ready-to-use scaffolds for slices and multi-store setups

Why now:
- Improve maintainability and testability
- Reduce accidental coupling and re-renders
- Prepare for features like admin/event creation, auth, or alternative backends (Vercel/CF/AWS)
