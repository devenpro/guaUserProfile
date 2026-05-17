# Changelog — User Profile App

All notable changes to this app. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Versioning is independent per app.

## [Unreleased] — Build, hygiene, and CI hardening

### Added

- **Minified bundles.** `scripts/build.mjs` now also emits
  `dist/up.min.js` (~93 KB, ~44 % smaller than `up.js`),
  `dist/up.min.js.map`, and `dist/up.min.css`. Minification runs via
  `npx --yes esbuild` and is best-effort locally (offline builds still
  produce the unminified pair and exit 0); CI is the source of truth.
- **Feature-branch build workflow** (`.github/workflows/build.yml`)
  rebuilds `dist/` on push to any non-main branch and commits the
  artifacts back, so mobile/web-only sessions can ship `src/`-only
  edits. Skips its own commits and `[release]` commits.
- **MIT `LICENSE`** at repo root + `"license": "MIT"` in `package.json`.
- **Sample data** under `docs/samples/` — empty and populated
  `field_json_data` blobs plus a matching `field_llm_config` example.
- **Pre-commit hook installer** (`bash scripts/install-hooks.sh`)
  symlinks `scripts/hooks/pre-commit` into `.git/hooks/`. The hook
  rebuilds `dist/` when `src/` is staged and parse-checks both
  `dist/up.js` and `dist/up.min.js` before allowing the commit through.

### Changed

- **Asset Injector URLs flipped to the minified bundles** in the
  README's quick-reference table:
  `…@latest/dist/up.min.js` and `…@latest/dist/up.min.css`. The
  unminified URL pattern is documented as a debugging fallback.
- `release.yml` and `build.yml` now `git add` the minified outputs and
  the source map; the jsDelivr purge loop covers all five paths.
- `CLAUDE.md` "Build hygiene" section updated to reference the new
  artifact set and the `UP_SKIP_MINIFY=1` escape hatch.

### Notes

- No feature code (anything under `src/`) was touched. The IIFE
  wrappers, init chain, save flow, and `field_llm_config` output
  contract are byte-for-byte unchanged. Consumer apps see no
  difference — same JSON, same shape, same producer.

## [0.2.0] — Provider editor + onboarding guides

### ⚠ BREAKING

- **Claude removed as a direct provider.** Anthropic's HTTP API requires the
  `anthropic-dangerous-direct-browser-access` header and is unreliable from
  browsers (CORS preflight failures, region blocks, header rejection in
  some browser versions). `claude` is dropped from `MODEL_CATALOG` and
  `PROVIDER_ORDER`, and the matching `case 'claude':` is removed from
  `buildTestRequest` in `05-key-verify.js`. `migrateData()` actively strips
  any existing `claude` entry from `S.data.providers` on next load and
  logs the removal to the activity feed. **Consumer apps that read
  `field_llm_config` and were depending on `provider.id === 'claude'`
  will see that provider disappear from existing users' configs after
  their next save.** Migrate consumers to OpenRouter's
  `anthropic/claude-sonnet-4` (already in the OpenRouter catalog) or
  another provider before any users save.

### Added

- **Full-page provider editor view** at `#provider/<id>` replaces the
  3-step modal. Two-column layout: form on the left (key + verify →
  models → params with sticky save bar), guide panel on the right
  (signup link, key URL, key-format hint, free-tier note, ordered setup
  steps, troubleshooting list).
- **Per-provider guides.** Each `MODEL_CATALOG` entry gains a `guide`
  block populated for all 13 remaining providers. Renderable separately
  via `renderProviderGuide()` (Part 2A).
- **Recommended Providers rail on the dashboard.** Always shows
  unconfigured `RECOMMENDED_ORDER` providers (Gemini → Groq →
  Hugging Face → OpenRouter → Mistral → DeepSeek → Together) as
  clickable cards, with free-tier badges and a one-line note from each
  provider's guide.
- **Welcome guide card** on the dashboard when zero providers are
  configured. 4-step onboarding with a "Start with <top-recommended>"
  CTA pointing at the first available recommended provider.
- **"Free tier" pill** on Providers list cards for catalog providers
  marked `free_tier: true`.
- New constants: `PROVIDER_EDITOR_HASH_PREFIX`, `RECOMMENDED_ORDER`,
  `REMOVED_PROVIDERS`. New state field `S.editingProviderId`.
- New renderer registry entries: `R.providerEditor`,
  `R.setupProviderEditorEvents`.
- New `_upPart2A` exports: `renderProviderEditor`, `saveProviderFromEditor`.
- New component schemas: `provider-editor` (view), `provider-guide`
  (data-export — describes the guide-block contract).

### Changed

- `readHash` / `navigate` (`06-navigation.js`) now recognise the
  `provider/<id>` parameterised route and resolve it to
  `{currentView: 'provider-editor', editingProviderId: <id>}`.
- `renderCurrentView` dispatches to `R.providerEditor` when the
  resolved view is `provider-editor`; falls back to a "Loading editor…"
  empty state if Part 2A hasn't loaded yet.
- `migrateData` resolves an initial `#provider/<id>` URL on first
  paint so deep links and bookmarks work without an extra navigation.
- Nav active state highlights "Providers" while in the editor
  sub-route.
- `[data-action="open-provider"]` (used by dashboard active cards,
  Recommended rail, Providers list, welcome card) now navigates to the
  editor instead of opening the deprecated modal.
- `onVerifySuccess` no longer DOM-patches the modal; it calls
  `render()` so the editor view redraws naturally with verified state.

### Removed

- `claude` provider entry from `MODEL_CATALOG` and `PROVIDER_ORDER`.
- `'claude'` branch from `buildTestRequest` (`05-key-verify.js`).
- `openProviderModal` and `renderProviderModalContent` functions
  (`04-provider-modal.js` gutted to shared form helpers only).
- `_verifyingProvider` variable and the modal-save fallback that used it.
- `data-action="live-refresh-modal"` handler (deprecated alongside the
  modal). The editor uses `data-action="live-refresh"`.
- `R.openProviderModal` registration and `openProviderModal` export
  from `_upPart2A`.

### Provider count

- v0.1.x: 14 catalog providers
- v0.2.0: **13** (Claude dropped)

## [1.0.0] — Baseline snapshot

This is the production-ready baseline that every subsequent change is measured against. Recorded from the v1.0.0 source files (`up-part1.js`, `up-part2a.js`, `up-part2b.js`, `up-part1.css`, `up-part2.css`).

### Architecture

- 2-field architecture: `field_json_data` (working state) + `field_llm_config` (clean LLM export consumed by every other app on the platform)
- 3-part JS load chain with polling guards (Part 1 → 2A polls 10s → 2B polls 15s)
- 2-part CSS (design tokens + shell + views in Part 1; modals + configuration UI in Part 2)
- IIFE pattern with `jQuery + Drupal`
- Event delegation throughout with unique namespaces
- Renderer registry seam (`window._upRenderers`) for future view overrides

### Views

- **Dashboard** — active provider grid + recent activity feed (expandable)
- **Providers** — full list with 5-filter toolbar (all/configured/unconfigured/major/infra), inline quick-test, enable/disable toggle, Configure/Manage button
- **Models** — per-provider model tables with toggle, default-star, category pill, temperature/token display, search, bulk enable/disable, live refresh per provider; profile-level default selector at the bottom

### Providers

- 14 built-in catalog providers: Gemini, Claude, OpenAI, Grok, Perplexity, DeepSeek, Groq, Mistral, GitHub Models, Cohere, NVIDIA, Hugging Face, Together AI, OpenRouter
- Custom provider support — users can add providers not in the catalog; they work identically to catalog providers throughout the app
- 4 test methods: `gemini` (key in URL), `claude` (x-api-key + anthropic-version headers), `cohere` (Bearer + v2 endpoint), `openai` (Bearer default)

### Features

- 3-step provider configuration modal (API Key → Models → Default Parameters)
- API key verification with auto-unlock of subsequent steps on success
- Inline quick-test per provider (no modal)
- Sequential "Test All" bulk connectivity check
- Live model discovery from `/v1/models` endpoint where available (8 of 14 catalog providers + custom)
- Heuristic category guessing for discovered models (powerful / balanced / fast)
- Import / Export configuration as JSON (with key masking option)
- Reset all providers ("Start Fresh") with confirmation
- Bulk enable/disable all models per provider
- Undo/redo with 50-entry stack (Part 2A)
- 30s auto-save (writes textareas; does not trigger Drupal submit)
- Keyboard shortcuts (Alt+1/2/3, Ctrl+S, Ctrl+Shift+E, Ctrl+Z/Y, Escape)

### Data model

- Provider state fields: `id`, `label`, `category`, `api_key`, `key_verified`, `key_verified_at`, `enabled`, `active` (legacy mirror), `models[]`, `last_live_refresh`, plus custom-only fields (`custom`, `test_endpoint`, `test_method`, `color`)
- Model state fields: `id`, `label`, `active`, `is_default`, `temperature`, `max_tokens`, `top_p`, `category`, `source`
- 8 activity types tracking provider lifecycle, key verification, model toggles, defaults, settings, and (reserved) LLM config sync
- Activity log capped at 200 entries (FIFO)
- 5 derived counts: `configuredCount`, `verifiedCount`, `enabledCount`, `exportableCount`, `totalActiveModels`

### Forward and backward compatibility

- `migrateData()` auto-adds new catalog providers and new catalog models to existing users on every load
- Old data without `enabled` field is back-filled from `active && key_verified`
- `active` field continues to mirror `enabled` to support older consumer code

### Known limitations / intentional non-features

- Brand context (`.brand-data`) is intentionally not parsed — provider configuration is brand-agnostic
- This app does not read `.llm-config-data`; it writes the source of that div
- 6 catalog providers (gemini, claude, grok, github, cohere, huggingface) don't support live model refresh — Live Refresh shows an info toast for them
- API key verification + live refresh both run directly from the browser using the user's key (no server proxy) — subject to CORS and quota consumption
- `openLLMConfigPreview()` exists in `_upPart2B` but has no built-in UI trigger; intentional for future use

### File sizes

| File | Lines |
|------|-------|
| `up-part1.js` | 1,403 |
| `up-part2a.js` | 1,150 |
| `up-part2b.js` | 684 |
| `up-part1.css` | 334 |
| `up-part2.css` | 140 |
| **Total** | **~3,711** |

### Public API surface

- Part 1 exports: 25 `window._up*` globals (state, constants, renderers registry, core fns, utilities, formatters, getters)
- Part 2A exports: `window._upPart2A` bundle of 15 methods
- Part 2B exports: `window._upPart2B` bundle of 9 methods

### Documentation set established

- `PROJECT.md` — overview, Drupal setup, file inventory, session template
- `ARCHITECTURE.md` — init chain, state, save flow, output contract, provider catalog, hash navigation, backward compat, verification, live refresh, activity log
- `DEVELOPMENT-GUIDE.md` — save flow pattern, adding providers/views/test methods/handlers, using global resources, common patterns, validation checklist
- `API-REFERENCE.md` — full table of all globals, registry hooks, output contract, activity types, data-action map, keyboard shortcuts
- `QUICK-REFERENCE.md` — one-page cheat sheet
- `STYLE-REFERENCE.md` — CSS design system, breakpoints, provider colors, component patterns, z-index map
- `CHANGELOG.md` — this file
