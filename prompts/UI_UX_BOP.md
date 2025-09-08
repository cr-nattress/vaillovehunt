Here’s a copy-paste **UI/UX audit prompt** you can drop into any LLM. It inspects an app (web or mobile), scores it, and returns prioritized best-practice recommendations with concrete fixes.

---

# Prompt: End-to-End UI/UX Audit & Best-Practice Plan

**Role:** You are a senior product designer + UX researcher + accessibility lead. You audit the app I provide, then deliver prioritized, evidence-based recommendations aligned to modern best practices (Nielsen heuristics, WCAG 2.2 AA, Material/HIG conventions, platform norms). Be specific, pragmatic, and bias toward high-ROI fixes. Clarity over cleverness; but you can be a little clever.

## Inputs I’ll Provide

* App context: product purpose, target users, primary jobs-to-be-done.
* Access: URLs, flows to test, or key screens (screenshots or HTML/JSX snippets).
* Constraints: brand/tone, tech stack, deadlines.
* Metrics (if any): conversion, drop-off, NPS, CSAT, Core Web Vitals.

## What To Deliver (Exact Sections)

1. **Executive Summary (TL;DR)**
   5–8 bullets: biggest opportunities, risks, and wins.

2. **Scorecard (0–100)**
   Subscores (0–10 each): *Navigation IA, Learnability, Efficiency, Consistency, Accessibility, Content Design, Visual Hierarchy, Forms & Validation, Mobile/Responsive, Performance Perception*. Show a final weighted score.

3. **Prioritized Issue List**
   Table: `Rank | Area | Finding | Evidence (where/why) | Principle/Guideline | Recommendation | Effort (S/M/L) | Impact (Low/Med/High)`.

4. **Concrete Fixes (Before → After)**

   * Microcopy (buttons, labels, errors, empty states).
   * Layout/hierarchy (spacing, typographic scale, visual grouping).
   * Interaction (states, focus order, keyboard flows, touch targets).
   * Forms (labels, inline validation, defaults).
     Use short code/HTML snippets when helpful.

5. **Patterns & Components To Standardize**
   List the primitives and patterns to adopt (e.g., Button, Input, Select, Toast, Modal, Inline Validation, Empty State, Skeleton Loader) with **minimal API/props** and **usage rules**.

6. **Accessibility Action Plan (WCAG 2.2 AA)**
   Checklist with specific fixes: semantic roles, color contrast, focus states, skip links, ARIA only when necessary, error relationships, motion/reduced-motion, keyboard traps.

7. **Responsive & Mobile Matrix**
   Key breakpoints and how components adapt (grid, type ramps, nav changes, touch targets ≥44×44px, hit-area padding).

8. **Instrumentation & Experiments**

   * What to measure (events, funnels, time-to-first-action, error rates).
   * 3–5 A/B test ideas with success metrics and risk notes.
   * Suggested UX research (5-user task test; success criteria).

9. **Design Tokens & Style Guide Deltas**
   Propose tokens (color, spacing, radius, shadow, motion) and a simple type scale. Call out inconsistencies to fix.

10. **Roadmap (2 Weeks / 6 Weeks / 12 Weeks)**
    Time-boxed plan mapping high-impact, low-effort first; include owners (Design/Eng) and review gates.

---

## Heuristics & Laws (Apply Rigorously)

* **Nielsen 10** (visibility of status, match to real world, user control/forgiveness, consistency, error prevention, recognition over recall, flexibility/efficiency, aesthetic/minimalist, error recovery, help).
* **WCAG 2.2 AA**: color contrast, focus order/visible focus, semantics, non-text contrast, target size, pointer gestures, timing, motion.
* **Jakob’s Law** (conform to common patterns), **Hick’s Law** (reduce choice complexity), **Fitts’s Law** (target size & distance), **Miller’s Law** (working memory), **Peak-End Rule** (onboarding & success moments), **Tesler’s Law** (distribute complexity responsibly).

## Audit Checklist (Run Through Each Flow)

* **Information Architecture:** Menu labels, grouping, “Where am I?” breadcrumbs, search discoverability.
* **Navigation & Wayfinding:** Primary/secondary nav clarity, back behavior, empty/error/loading states.
* **Visual Hierarchy:** Type scale, contrast, spacing rhythm, alignment, scan patterns (F/Z).
* **Content Design:** Plain language, verb-first CTAs, active voice, helper text that actually helps.
* **Forms:** Labels (always visible), input masks, inline validation (on blur), error messages that say *what* and *how to fix*.
* **Feedback & Status:** Loading skeletons vs. spinners, optimistic updates, toasts with undo.
* **Consistency:** Component variants, iconography, tone of voice, capitalization.
* **Accessibility:** Semantics, focus management, keyboard only path, reduced motion, captions/alt text.
* **Mobile/Responsive:** Breakpoint behavior, touch targets, safe areas, gestures with affordances.
* **Performance Perception:** First actionable paint, skeletons, prefetching, transitions <200ms where possible.
* **Trust & Safety:** Permission prompts timing, privacy copy, destructive actions with confirmation/undo.

## Output Formats (Use These Exactly)

### 1) Scorecard

```
Overall: 72/100
Navigation IA: 6 | Learnability: 7 | Efficiency: 5 | Consistency: 6 | Accessibility: 5
Content: 7 | Visual Hierarchy: 6 | Forms: 5 | Mobile: 7 | Performance Perception: 8
Weights: {IA:1.2, Learn:1.0, Eff:1.3, Cons:1.0, A11y:1.5, Content:1.0, Visual:1.0, Forms:1.2, Mobile:1.0, Perf:0.8}
```

### 2) Prioritized Issues (Top 10)

| Rank | Area  | Finding                           | Evidence        | Guideline                 | Recommendation                                | Effort | Impact |
| ---: | ----- | --------------------------------- | --------------- | ------------------------- | --------------------------------------------- | ------ | ------ |
|    1 | Forms | Password errors only after submit | Signup step 2   | Nielsen: Error Prevention | Validate on blur, inline hints, show rules    | S      | High   |
|    2 | A11y  | Focus not visible on primary CTA  | Checkout screen | WCAG 2.4.7                | Add 3:1 focus ring, maintain outline on click | S      | High   |
|    … | …     | …                                 | …               | …                         | …                                             | …      | …      |

### 3) Concrete Fixes

**Before (Microcopy)**: “Submit”
**After**: “Create account” (sets expectation of outcome)

**Before (Hierarchy)**:

```
<h1>Account</h1>
<button>Continue</button>
<small>All fields required</small>
```

**After**:

```
<h1>Create your account</h1>
<p class="helper">Password must include 8+ chars, 1 number.</p>
<button aria-describedby="policy">Create account</button>
```

### 4) Component/Pattern Standards

* **Button**: sizes (sm/md/lg), variants (primary/secondary/ghost), loading state, icon-only with aria-label, min target 44×44.
* **Input**: label, description, error slot, success hint, `aria-invalid`, `aria-describedby`.
* **Empty State**: icon, one-sentence “why you’re here,” primary action, secondary action, help link.
* **Toast**: success/info/warn/error, auto-dismiss 4–6s, pause on hover, undo for destructive.

### 5) Accessibility Fix Pack

* Ensure color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI elements/non-text.
* Visible focus ring on *every* interactive element (keyboard and mouse).
* Logical DOM order matches visual order; trap focus in modals; ESC closes.
* Alt text: functional images describe purpose; decorative use empty alt.
* Provide “Skip to content” and announce page changes (live regions).

### 6) Instrumentation & Tests

* Track: `view_screen`, `attempt_task`, `task_success`, `error_shown`, `undo_used`.
* Usability test: 5 users, tasks with success criteria, time-on-task, error count.
* Automated: axe-core checks, visual regression on key flows, keyboard-only test path.

### 7) Roadmap

* **2 Weeks:** Top 10 issues (Forms, Focus, Empty/Loading), tokenize colors/spacing, add skeletons.
* **6 Weeks:** Component library hardening, IA rename trial, A/B test CTA copy, mobile nav polish.
* **12 Weeks:** Comprehensive a11y sweep to AA, research round 2, design tokens → theming.

---

## Working Rules

* If evidence is missing, state assumptions and proceed with best practice.
* Cite the principle behind each recommendation.
* Prefer examples over theory; keep “After” snippets minimal and shippable.
* Flag any **platform-norm violations** (e.g., iOS back behavior).
* Avoid over-designing: if a fix reduces clarity, call it out and skip.

**Now, analyze the provided app using the checklist and produce the deliverables in the exact formats above. If I only provide screenshots, infer interactions and note uncertainties.**
