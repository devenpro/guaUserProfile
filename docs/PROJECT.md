# User Profile App — Project Overview

> Drupal 11 node-based single-page application that manages AI provider configurations for the GoUltra AI platform.

| Property | Value |
|----------|-------|
| Version | 1.0.0 |
| Content type | `user_profile` |
| Body class | `node--type-user-profile` |
| CSS prefix | `up-` |
| JS prefix | `_up` |
| Field count | 2 (no `field_json_meta`) |
| Total LOC | ~3,711 (JS + CSS) |

---

## The One Thing That Makes This App Different

**Every other app on the GoUltra platform _consumes_ AI configuration. This app _produces_ it.**

```
                                                    ┌── YouTube Video Planner
                                                    ├── Social Content Planner
  User Profile App  ──► field_llm_config ──►  ──►  ├── Video Production
  (this app)              (Drupal field)             ├── GTM Planner
                                                    └── Local Business Website Planner
                              │
                              ▼
                  Drupal renders into
                  <div class="llm-config-data">
                  ...
                  </div>
                              │
                              ▼
                  Other apps call LLMService.init()
                  which reads this div on page load
```

This producer/consumer split has practical consequences:

- This app **does not** have `LLMService.init()` or `.llm-config-data` reading code.
- This app **does not** consume brand context (no `.brand-data` parsing).
- This app's "AI calls" are **connectivity tests**, not chat completions.
- The famous "hash navigation AI loading issue" (consumer apps occasionally miss the LLM config on direct hash URLs) **does not apply here** — see [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-hash-navigation-handling).

If you're building a new app on the platform, read the *consumer* apps' docs for AI loading patterns. This app is the source of truth for the config they consume.

---

## Drupal Setup

### Content Type

`user_profile` — exactly one node per user; serves as their personal AI provider configuration. Body class is `node--type-user-profile`.

### Fields

| Field | Machine Name | Type | Selector | Stored as | State path |
|-------|--------------|------|----------|-----------|------------|
| Working state | `field_json_data` | Textarea (plain) | `#edit-field-json-data-0-value` | Full provider state, models, activity, preferences (JSON) | `S.data` |
| LLM config export | `field_llm_config` | Textarea (plain) | `#edit-field-llm-config-0-value` | Auto-generated clean export consumed by other apps (JSON) | `buildLLMConfig()` output |

Both fields are hidden by `detectDrupalForm()` in Part 1. The `.form-actions`, `.node-form-options`, and `.field--name-title` regions are hidden too — the app's own Save button calls the Drupal submit programmatically.

### Asset Injector Entries

All conditioned on body class `node--type-user-profile`:

| Order | Type | File | Placement |
|-------|------|------|-----------|
| 1 | CSS | `up-part1.css` | Header |
| 2 | CSS | `up-part2.css` | Header |
| 3 | JS | `up-part1.js` | Footer |
| 4 | JS | `up-part2a.js` | Footer |
| 5 | JS | `up-part2b.js` | Footer |

Load order matters: Part 2A polls for Part 1's globals; Part 2B polls for Part 2A's. The init guards include timeouts (10s for 2A, 15s for 2B) so a missing file produces a clear console error rather than a silent hang.

### Required Site-Wide Assets

| Asset | Purpose | Loaded by |
|-------|---------|-----------|
| jQuery | DOM + delegated events | Drupal core |
| Drupal (object) | `Drupal.behaviors.upPart1.attach` | Drupal core |
| Font Awesome Pro | All icons (used via `icon()` helper) | Site theme / global Asset Injector |
| Google Fonts: DM Sans, Plus Jakarta Sans, JetBrains Mono | Typography | Site theme |

If Font Awesome is missing, icons silently fall back to empty `<i>` tags but layout still works.

---

## File Inventory

Source is split into per-section files under `src/`. Each Part is a single IIFE distributed across numbered files; the first file opens the IIFE, the last closes it. The bundler at `scripts/build.mjs` lex-concatenates them into `dist/up.{js,css}`.

### CSS (`src/styles/`)

| File | Role |
|------|------|
| `src/styles/10-part1/up-part1.css` | Design tokens, app shell, header, sidebar, all three views, toggles, toasts, crash card, 4 responsive breakpoints |
| `src/styles/20-part2/up-part2.css` | Modals, confirm dialogs, configuration steps, model cards in modal, parameter controls, alerts |

### Part 1 — Core engine (`src/10-part1/`, 16 files)

| File | Role |
|------|------|
| `00-header.js` | IIFE open, version banner, `window._upRenderers` init |
| `01-constants.js` | `APP_VIEWS`, `MODEL_CATALOG` (13 providers, each with `guide` block), `PROVIDER_ORDER`, `RECOMMENDED_ORDER`, `REMOVED_PROVIDERS`, `PROVIDER_EDITOR_HASH_PREFIX`, `ACTIVITY_TYPES`, `CATEGORY_LABELS` |
| `02-state.js` | The `S` state object |
| `03-init.js` | `isUPPage`, `Drupal.behaviors.upPart1`, `window.load` fallback, `init`, `parseUserData`, `detectDrupalForm`, `loadData` (with `S._rawDataEmpty` capture), `getDefaultData`, `migrateData` |
| `04-maps.js` | `buildMaps` (rebuilds `providerMap`, counts, `activeProviders`) |
| `05-llm-config.js` | `buildLLMConfig` (the platform-critical export contract) |
| `06-navigation.js` | `navigate`, `readHash`, `renderCurrentView` (with try/catch + crash card), `renderCrashCard` |
| `07-utilities.js` | `esc`, `icon`, `deepClone`, `truncate`, `maskKey`, `debounce`, `isEmpty`, `formatDate`, `formatRelativeTime`, `generateId`, `getRecentActivity`, `getFilteredProviders`, `getProviderColor`, `categoryPill`, `_safeBlock` |
| `08-app-shell.js` | `renderApp` — the top-level header / sidebar / content scaffold |
| `09-dashboard.js` | `renderDashboard` |
| `10-providers.js` | `renderProviders` |
| `11-models.js` | `renderModels` |
| `12-events.js` | `setupEventHandlers`, `startAutoSave` (13 delegated handlers + 30s auto-save) |
| `13-sync-save.js` | `syncToTextarea` (the only writer of `field_llm_config`), `updateSaveStatus` |
| `14-toast.js` | `toast` notifications |
| `15-exports.js` | `window._up*` exports (incl. `window._upSafeBlock`), IIFE close |

### Part 2A — Provider configuration engine (`src/20-part2a/`, 10 files)

| File | Role |
|------|------|
| `01-init.js` | IIFE open, var declarations, polling guard (10s timeout), `initPart2A` (wraps `setupPart2AEvents` in `safeBlock`) |
| `02-modal-system.js` | `openModal`, `closeModal`, `openConfirmDialog`, `closeConfirmDialog` |
| `03-undo-redo.js` | `snapshot`, `undo`, `redo` (max 50 stack entries) |
| `04-provider-modal.js` | Shared form helpers (`renderModelSelectionList`, `renderParameterControls`) reused by the editor view. The modal-based configurator itself was removed in v0.2.0. |
| `04b-provider-editor-view.js` | `renderProviderEditor`, `renderProviderGuide`, `setupProviderEditorEvents` — the full-page editor at `#provider/<id>` |
| `05-key-verify.js` | `buildTestRequest`, `verifyApiKey`, `quickTestConnection`, `testAllConnections` (3 test methods: gemini, cohere, openai) |
| `06-provider-crud.js` | `saveProviderFromEditor`, `removeProvider`, `openAddCustomProviderModal` |
| `07-change-default.js` | `openChangeDefaultModal` and helpers |
| `08-events.js` | `setupPart2AEvents` (delegated handlers for verify, CRUD, slider inputs) |
| `09-exports.js` | `window._upPart2A` registry, IIFE close |

### Part 2B — Advanced features (`src/30-part2b/`, 9 files)

| File | Role |
|------|------|
| `01-init.js` | IIFE open, var declarations, polling guard (15s timeout), `initPart2B` (wraps `setupPart2BEvents` and `setupKeyboardShortcuts` in `safeBlock`) |
| `02-live-refresh.js` | `MODEL_LIST_ENDPOINTS`, `liveRefreshModels`, `parseModelList`, `guessCategory`, `mergeDiscoveredModels` (8 of 13 providers supported) |
| `03-llm-config-preview.js` | `openLLMConfigPreview` modal |
| `04-import-export.js` | `exportConfig`, `importConfig` (with key-masking option) |
| `05-bulk-ops.js` | `enableAllModels`, `disableAllModels` per provider |
| `06-reset.js` | `resetAllProviders`, `clearActivity` |
| `07-shortcuts.js` | `setupKeyboardShortcuts` (Alt+1/2/3, Ctrl+Shift+E, Ctrl+S) |
| `08-events.js` | `setupPart2BEvents` (8 delegated handlers) |
| `09-exports.js` | `window._upPart2B` registry, IIFE close |

Total: 36 source files. **Individual source files are not standalone-valid JS** — only the concatenated `dist/up.js` is. Linters run on individual files will complain; lint the bundle output if needed.

### Auto-generated component index

See [docs/COMPONENT-INDEX.md](COMPONENT-INDEX.md) for a machine-friendly map of the 6 logical components (3 views, 2 AI actions, 1 data export) keyed by `.component.json` schemas under `components/`.

---

## Global Resources

### User Information

Parsed from `#guau-userdata` div by `parseUserData()`:

```javascript
S.user = {
  id:        '#guau-userid',
  name:      '#guau-username',
  email:     '#guau-useremail',
  fullName:  '#guau-userfullname',
  timezone:  '#guau-usertimezone',
  roles:     '#guau-userroles'
};
```

Used for: header initials (computed from `fullName`), activity log author attribution (`user_id` + `user_name`). The app warns but does not fail if the div is missing.

### AI Configuration — Produced, Not Consumed

There is no AI config to "load" — this app writes `field_llm_config` itself.

- The **catalog of available providers** lives in code: `MODEL_CATALOG` in `up-part1.js` §1.
- The **user's configured state** lives in `field_json_data` → parsed into `S.data.providers[]`.
- The **clean export** is computed on every `syncToTextarea()` via `buildLLMConfig()` and written to `field_llm_config`.

### Brand Context — Intentionally Not Used

The platform exposes `.brand-data` for apps that need brand identity. This app does not parse it because provider configuration is brand-agnostic. If brand-driven theming is added later, the integration point would be in `renderApp()`'s header construction.

---

## App-Specific Libraries

These are in-code constants/registries owned by this app:

| Library | Location | Purpose |
|---------|----------|---------|
| `MODEL_CATALOG` | Part 1 §1 in `01-constants.js` | Spec for 13 built-in providers (label, icon, color, endpoint, test method, free_tier, recommended_rank, guide, models) |
| `RECOMMENDED_ORDER` | Part 1 §1 in `01-constants.js` | Provider ids promoted on the dashboard's Recommended Free Providers rail |
| `REMOVED_PROVIDERS` | Part 1 §1 in `01-constants.js` | Retired provider ids (currently `claude`) — stripped from user data by `migrateData()` on next load |
| `PROVIDER_ORDER` | Part 1 §1, line 202 | Canonical iteration order of catalog providers |
| `APP_VIEWS` | Part 1 §1 | Routing + sidebar definition |
| `ACTIVITY_TYPES` | Part 1 §1 | Icon + color per activity event type (8 types) |
| `CATEGORY_LABELS` | Part 1 §1 | Fast/Balanced/Powerful pill styling |
| `MODEL_LIST_ENDPOINTS` | Part 2B §2 | Providers that support live `/v1/models` discovery (8 of 14) |
| `window._upRenderers` | Set by Part 1, populated by Part 2A | Renderer-override registry — extension seam for future view takeover |

See [API-REFERENCE.md](./API-REFERENCE.md) for full schemas.

---

## Session Template

Use this skeleton when starting a chat session against this app:

```
# SESSION GOAL
[ ] Bug fix:        [describe]
[ ] Small feature:  [describe]
[ ] Major feature:  [describe]
[ ] Architecture:   [describe]
[ ] New app:        [describe]

# RELEVANT FILES TO READ FIRST
- /mnt/project/up-part1.js (sections N–M)
- /mnt/project/up-part2a.js (sections N–M)
- /mnt/project/up-part2b.js (sections N–M)

# CONSTRAINTS / NON-NEGOTIABLES
- Preserve the syncToTextarea() save flow
- Maintain `up-` prefix
- Use icon() helper, not emoji
- All state changes follow: update → buildMaps → syncToTextarea → render → toast
- Event handlers use delegation with unique namespaces

# DELIVERABLES
[ ] Replacement function blocks
[ ] Updated CSS rules
[ ] Test plan
[ ] Updated CHANGELOG entry
```

---

## Knowledge Docs

| Doc | Purpose |
|-----|---------|
| `PROJECT.md` | This file — high-level overview, Drupal config, file inventory, session template |
| `ARCHITECTURE.md` | Init chain, state object, data flow, provider model, hash navigation, extension seams |
| `DEVELOPMENT-GUIDE.md` | How to add providers/views/handlers/test methods, build new apps, common patterns |
| `API-REFERENCE.md` | Every `window._up*` global, every method on `_upPart2A`/`_upPart2B`, output contract |
| `QUICK-REFERENCE.md` | One-page cheat sheet — Drupal config, shortcuts, data-actions, file sizes |
| `STYLE-REFERENCE.md` | CSS design system — tokens, breakpoints, component patterns, provider colors |
| `CHANGELOG.md` | Version history |
