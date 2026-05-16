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

| File | Lines | Role |
|------|-------|------|
| `up-part1.css` | 334 | Design tokens, app shell, header, sidebar, all three views, toggles, toasts, 4 responsive breakpoints |
| `up-part2.css` | 140 | Modals, confirm dialogs, configuration steps, model cards in modal, parameter controls, alerts |
| `up-part1.js` | 1,403 | 15 sections: constants → state → init → maps → LLM config builder → navigation → utilities → app shell → 3 view renderers → events → sync/save → toasts → exports |
| `up-part2a.js` | 1,150 | 9 sections: init → modal system → undo/redo → provider config modal (3-step) → key verification (4 methods) → save/remove → change default → add custom provider → events |
| `up-part2b.js` | 684 | 9 sections: init → live model refresh → LLM config preview → import/export → bulk model ops → reset → keyboard shortcuts → events |
| `up-sample-data.json` | — | Example `field_json_data` content with 5 verified providers + activity log |
| `up-sample-llm-config.json` | — | Example `field_llm_config` content — the export contract consumer apps depend on |
| **Total JS + CSS** | **~3,711** | |

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
| `MODEL_CATALOG` | Part 1 §1, lines 46–199 | Spec for 14 built-in providers (label, icon, color, endpoint, test method, models) |
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
