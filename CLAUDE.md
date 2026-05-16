# Working with Claude on User Profile

This is the standing agreement between the user and Claude Code for this
repo. It's loaded automatically at session start, so the rules below
apply without needing to be repeated each task.

## Project orientation

User Profile is a vanilla-JS + jQuery app embedded via Drupal's Asset
Injector module on a `user_profile` content node. Source lives in
`src/` (three IIFE parts: `10-part1`, `20-part2a`, `30-part2b`). Each
Part is a single IIFE distributed across numbered sub-files (Part 1:
`00-header.js` → `15-exports.js`; Parts 2A/2B: `01-init.js` →
`09-exports.js`). The bundler at `scripts/build.mjs` lex-concatenates
every file under `src/` into `dist/up.js` + `dist/up.css`, which **are
checked in**. Drupal loads the dist files from jsDelivr (or `@main`
until Phase A wires up `@latest`). Individual source files are not
standalone-valid JS — the IIFE open lives in the first file of each
Part, the close lives in the last file, and everything between is
free-floating code inside that IIFE scope.

> **App-specific identity**
>
> - CSS prefix: `up-`
> - JS prefix: `_up` (window globals)
> - Drupal content type: `user_profile`
> - Body class: `node--type-user-profile`
> - Drupal fields: `field_json_data` (working state) + `field_llm_config` (clean export)

## Producer, not consumer

User Profile is **the only producer** of LLM configuration on the
platform. It writes `field_llm_config`; every other app reads that
field via Drupal's `.llm-config-data` div. Practical rules:

- This app does **not** parse `.llm-config-data` and must not be
  retrofitted to do so.
- This app does **not** parse `.brand-data` either — provider config is
  brand-agnostic.
- Any change that alters the JSON shape written to `field_llm_config`
  is a breaking change for every other app on the platform. See
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §4 for the contract.
- "AI calls" in this app are **connectivity tests** (key verification)
  and **model discovery** (live refresh of `/v1/models`), not chat
  completions.

## Init pattern (3-part polling chain)

Page load fires `Drupal.behaviors.upPart1.attach`. Part 1 initializes
synchronously, exports ~25 globals as `window._up*`, then sets
`window._upState.initialized = true`. Part 2A polls every 100 ms (max
100 attempts = 10 s) for that flag, then imports the globals, registers
its renderer hooks in `window._upRenderers`, and exports
`window._upPart2A`. Part 2B polls every 100 ms (max 150 attempts =
15 s) for both `window._upPart2A` and `window._upState.initialized`,
then exports `window._upPart2B`. Timeouts log `[UP] Part 2A/B: Timed
out waiting for …` to console — they do not crash the page.

Do **not** restructure the polling guards without thinking about what
happens when a Part fails to load (404 on Asset Injector, syntax error
in dist, etc.).

## The mandatory save flow

Every user action that changes state follows this exact 7-step
sequence (full version in [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md)):

```
1. Mutate S.data directly
2. logActivity(type, description)        if user-facing
3. snapshot('label')                     if Part 2A loaded (for undo)
4. buildMaps()                           rebuild lookup maps + counts
5. syncToTextarea()                      THE ONLY WRITER OF field_llm_config
6. render()                              re-render current view
7. toast(msg, type)                      user feedback
```

**Never skip step 5.** It's the only function that writes
`field_llm_config`. Skipping it means every consumer app on the
platform sees stale AI config.

## The 7-step session workflow (adapted from platform standard)

### 1. Triage

Trivial single-edit work → no plan mode, announce the change in one
sentence and do it. Multi-file, ambiguous, or anything touching the
init chain / save flow / LLM config output contract → enter plan mode,
propose phases, `ExitPlanMode` for approval before touching code. The
user can force plan mode any time with "let's plan first".

### 2. Branch from fresh main

```bash
git checkout main && git pull origin main
git checkout -b claude/<verb>-<slug>
```

Never branch from a stale local main. Never reuse a previously-merged
branch.

### 3. Implement, one commit per phase

For each phase:

1. Edit source files under `src/`.
2. Rebuild: `node scripts/build.mjs`.
3. Parse-check: `node -e "new Function(require('fs').readFileSync('dist/up.js','utf8'))"`.
4. Stage source AND dist together: `git add src/ dist/`.
5. Commit with a conventional-commit subject (≤72 chars).
6. **Do not push between phases.** Commits accumulate locally until all
   phases are done.

If a real ambiguity surfaces mid-phase (the change could reasonably go
two ways), pause and use `AskUserQuestion` — don't guess.

Docs-only changes skip the rebuild + parse-check (no dist impact).

### 4. Push once when all phases are done

```bash
git push -u origin claude/<branch-name>
```

Report back: "Branch `claude/...` is ready with N commits — open a PR
when you want to ship." **Do not open the PR.**

### 5. User opens + merges the PR

The user opens the PR from the Claude Code UI's "Open PR" button and
either merges it themselves or asks Claude to merge via
`gh pr merge --squash`. Squash-merge is the project convention so the
(eventual) auto-release workflow sees one logical commit per merged PR.

### 6. Auto-release runs (Phase A onwards)

Until Phase A lands `.github/workflows/release.yml`, releases are
manual: bump `package.json` version by hand, rebuild, commit as
`[release] vX.Y.Z`, `git tag vX.Y.Z`, `git push --tags`. Once Phase A
is merged, this happens automatically on every push to `main`.

### 7. User verifies in production, in this order

1. **Drupal cache clear.** `drush cr` or **Configuration → Development →
   Performance → Clear all caches**.
2. **Browser hard-refresh.** `Ctrl+Shift+R` / `Cmd+Shift+R`.
3. **DevTools console check.** Look for `window.UP_VERSION` matching
   the new release; `window.UP_BUILD_TIME` should be later than the
   previous working version. Build timestamp is ground truth.

(Once Phase A adds an in-Part-1 init banner, the console will print
`[UP] User Profile vX.Y.Z · built <ISO>` on every load — same as CP.)

## Build hygiene

`dist/up.js` and `dist/up.css` are checked in and must move in
lockstep with `src/`. Always rebuild + parse-check before committing
source changes. The parse-check catches syntax errors that
TypeScript-style tools would otherwise find — this codebase has no test
suite.

`npm run build` runs two scripts:

1. `scripts/build.mjs` — concatenates `src/` → `dist/up.{js,css}`.
2. `scripts/build-component-index.mjs` — walks `components/**/*.component.json`
   and regenerates `docs/COMPONENT-INDEX.md`. Output is deterministic
   (no timestamps in the file content), so unchanged inputs produce a
   byte-identical file — safe to chain.

`npm run build:bundle` and `npm run build:index` run them separately.

## Component schemas

Every view, AI action, and data-export has a sibling
`<name>.component.json` under `components/`. These schemas are the
authoritative map of "what this app does" for AI agents reading the
codebase. Schema is informal (no validator), but the convention is:

```json
{
  "name": "<short-id>",
  "type": "view" | "ai-action" | "data-export",
  "summary": "<one to three sentences>",
  "entry": "<function name to grep for>",
  "source": "<path:line>",
  "triggers": [...],
  "reads":  { "state": [...], "dom": [...], "network": [...] },
  "writes": { "state": [...], "dom": [...], "network": [...] },
  "produces_html": true | false,
  "network_contract": { ... },         // ai-actions only
  "output_contract":  { ... },         // data-exports only
  "failure_modes": [{ "scenario": "...", "handling": "..." }],
  "tags": [...],
  "related": [...]
}
```

When you add a renderer, AI action, or data export to `src/`, add the
matching `.component.json` in the same PR. When you modify behavior
that changes triggers, inputs, outputs, or failure modes, update the
schema in the same PR. The generator catches stale schemas only
indirectly (the index will be out of sync with reality), so doc-sync is
a developer discipline, not an enforced gate.

## Doc sync

When a phase introduces a behavior change, naming change, or trigger
change that contradicts existing wording in `CLAUDE.md`,
`docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/API-REFERENCE.md`,
`docs/DEVELOPMENT-GUIDE.md`, `docs/QUICK-REFERENCE.md`,
`docs/STYLE-REFERENCE.md`, or `docs/CHANGELOG.md`, the same commit (or
a paired docs commit in the same PR) updates those docs so the next
session reads accurate guidance.

## Conventional commit prefixes

- `fix(<scope>): …` — bug fix
- `feat(<scope>): …` — new feature
- `refactor(<scope>): …` — internal cleanup, no behavior change
- `ci(<scope>): …` — CI/workflow changes
- `docs(<scope>): …` — docs only

Scopes are short: `init`, `verify`, `live-refresh`, `llm-config`,
`modal`, `release`, etc. The squash commit's subject becomes the
GitHub Release notes line, so write the PR title thoughtfully.

## Branch naming

`claude/<verb>-<slug>`. Examples:

- `claude/fix-verify-cors`
- `claude/add-deepseek-models`
- `claude/refactor-modal-state`
- `claude/audit-init-pipeline`

Verbs: `fix`, `add`, `refactor`, `audit`, `remove`, `docs`.

## What Claude will not do unsolicited

- **Open a PR.** User opens it from the Claude Code UI.
- **Push to `main` directly.** Always work through a feature branch.
- **Force-push** (`--force` / `--force-with-lease`) — even on a feature
  branch — without explicit permission.
- **Skip git hooks** (`--no-verify`).
- **Bump the version manually** in `package.json` once Phase A is in
  place — the release workflow owns that.
- **Change the LLM config output contract** without explicit
  acknowledgement that this is a breaking change for every other app
  on the platform.
- **Skip `syncToTextarea()`** in any state-mutating code path.
- **Add `.llm-config-data` or `.brand-data` parsing.** This app is the
  producer; it has no business consuming.
- **Restructure the source-tree split without thinking it through.**
  Each Part is a single IIFE distributed across numbered files. The
  open paren (`(function($, Drupal) { 'use strict';`) lives in the
  first file (`00-header.js` for Part 1, `01-init.js` for Parts
  2A/2B); the close paren (`})(jQuery, Drupal);`) lives in the last
  file (`15-exports.js` for Part 1, `09-exports.js` for Parts 2A/2B).
  Adding, removing, or reordering files within a Part folder changes
  concatenation order and can break the IIFE wrapping. Touch the split
  structure only in a dedicated refactor session.
- **Mirror state outside `S.data`.** All persisted state lives in
  `field_json_data` (via `S.data`); everything else (counts, maps,
  filters, lifecycle flags) is derived and rebuilt by `buildMaps()`.
- **Trigger `/ultrareview`** or other user-billed automation — user-only.

## Hotfix exception

If the user says "hotfix" or "broken in prod", Steps 1–7 still apply but
Claude skips plan mode unless the fix genuinely needs design discussion.
Speed > formality for hotfixes.

## Roadmap of upcoming structural phases

Tracked in the latest discovery report (or this session's plan file).
Summary:

- **Phase A — Operations layer.** Add in-Part-1 console init banner,
  `.github/workflows/release.yml`, switch Asset Injector to `@latest`.
- **Phase B — Resilience layer.** `try/catch` around `renderCurrentView`
  with a crash card; `_safeHandlerBlock` islands around event-handler
  registration; `window.load` fallback alongside `Drupal.behaviors`.
- **Phase C — Asset Injector cutover.** Drupal-side URL switch from
  `@main` to `@latest` after first CI release.
- **Phase D — AI-friendliness layer.** `.component.json` schemas
  alongside renderers and AI actions; auto-generated
  `docs/COMPONENT-INDEX.md`.
- ~~**Phase E — Source-tree splitting.**~~ Done. Each Part is now
  distributed across numbered per-section files; see "Project
  orientation" above for the file inventory.
