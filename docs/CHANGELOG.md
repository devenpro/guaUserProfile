# Changelog — User Profile App

All notable changes to this app. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
Versioning is independent per app.

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
