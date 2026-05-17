# Architecture — User Profile App v1.0

## 0. Producer, Not Consumer

This app is the **single source** of the platform's AI provider configuration. It writes `field_llm_config`, which Drupal renders into a `.llm-config-data` div on every page. Every other app on the platform reads that div via `LLMService.init()`. This app does **not** read it — it has no consumer-side code path for AI config.

Practical consequences:

- No `.llm-config-data` parsing
- No brand context parsing
- "AI calls" here are connectivity tests + model discovery, not chat completions
- The hash-navigation AI loading issue documented for consumer apps does **not** apply (see [§6](#6-hash-navigation-handling))

---

## 1. Initialization Chain

```
Page Load
  └─ Part 1 JS (Drupal.behaviors.upPart1.attach)
       ├─ isUPPage()           — checks body class 'node--type-user-profile'
       ├─ parseUserData()      — reads #guau-userdata → S.user
       ├─ detectDrupalForm()   — finds + hides textareas, form, .form-actions
       ├─ loadData()           — JSON.parse(field_json_data) → S.data
       ├─ migrateData()        — backward + forward compat:
       │                         • ensure each provider has 'enabled' field
       │                         • auto-add missing catalog providers
       │                         • auto-add missing catalog models per provider
       │                         • readHash() → S.currentView
       ├─ buildMaps()          — populates providerMap, 5 counts, activeProviders[]
       ├─ renderApp()          — injects #upApp, renders header + sidebar + first view
       ├─ setupEventHandlers() — 14 delegated handlers
       ├─ startAutoSave()      — 30s interval, syncs if dirty
       ├─ Exports ~25 globals (window._up*)
       └─ S.initialized = true

  └─ Part 2A polls every 100ms (max 100 attempts = 10s)
       ├─ Waits for window._upState.initialized
       ├─ Imports 22 Part 1 globals into local vars
       ├─ Registers in window._upRenderers:
       │     • openProviderModal
       │     • openAddCustomProviderModal
       ├─ setupPart2AEvents() — 14 delegated handlers (modal, verify, CRUD)
       ├─ snapshot('Initial state') — seeds undo stack
       ├─ render() — re-renders so handlers registered above take effect
       └─ Exports window._upPart2A (15 methods)

  └─ Part 2B polls every 100ms (max 150 attempts = 15s)
       ├─ Waits for window._upPart2A AND window._upState.initialized
       ├─ Imports Part 1 globals + Part 2A bundle
       ├─ setupPart2BEvents() — 8 delegated handlers (export, import, bulk, reset)
       ├─ setupKeyboardShortcuts() — Alt+1/2/3, Ctrl+Shift+E, Ctrl+S
       ├─ render() — final re-render
       └─ Exports window._upPart2B (9 methods)
```

**On timeout:** Part 2A errors after 10s if Part 1 never initialized. Part 2B errors after 15s if Part 2A never registered. Both errors are visible in the browser console with a `[UP]` prefix.

---

## 2. State Object (S)

```javascript
S = {
  data: {                          // ← Persisted to field_json_data
    providers: [{
      id: 'gemini',                // Provider identifier (lowercase)
      label: 'Gemini',             // Display name
      active: true,                // Synced with `enabled` (backward compat — see §7)
      enabled: true,               // User toggle — controls LLM config export
      api_key: 'AIza...',          // Raw API key (sensitive)
      key_verified: true,          // System — last API test passed
      key_verified_at: '2026-...', // ISO timestamp of last verify
      category: 'major',           // 'major' | 'infra' | 'custom'
      models: [{
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        active: true,              // User toggle — include in export
        is_default: true,          // Star — provider-level default model
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
        category: 'fast',          // 'fast' | 'balanced' | 'powerful'
        source: 'catalog'          // 'catalog' | 'live_refresh'
      }],
      last_live_refresh: null,     // ISO timestamp of last /v1/models pull
      // Custom providers only:
      custom: true,
      test_endpoint: 'https://...',
      test_method: 'openai',
      color: 'hsl(120, 55%, 45%)'  // From generateCustomColor()
    }],
    default_provider: 'gemini',
    default_model: 'gemini-2.5-flash',
    preferences: { auto_sync_llm_config: true, timezone: 'UTC' },
    activity: [{                   // Capped at 200 entries (FIFO)
      id, type, description, timestamp, user_id, user_name
    }]
  },
  user: { id, name, email, fullName, timezone, roles },  // ← from #guau-userdata
  // Lookup maps (rebuilt by buildMaps)
  providerMap: {},                 // { providerId → provider object }
  activeProviders: [],             // Verified + enabled + has active models
  configuredCount: 0,              // Has an API key entered
  verifiedCount: 0,                // Key has been verified
  enabledCount: 0,                 // User toggle is on
  exportableCount: 0,              // In the LLM config export
  totalActiveModels: 0,            // Sum across exportable providers
  // UI state
  currentView: 'dashboard',
  previousView: null,
  providerFilter: 'all',           // 'all' | 'configured' | 'unconfigured' | 'major' | 'infra'
  modelSearch: '',
  activityExpanded: false,
  // Drupal refs (set by detectDrupalForm)
  $textarea: null,                 // field_json_data jQuery
  $llmConfigTextarea: null,        // field_llm_config jQuery
  $form: null,
  $submitBtn: null,
  // Lifecycle
  _initializing: false,
  initialized: false,
  dirty: false,
  autoSaveTimer: null,
  // Added by Part 2A
  undoStack: [],                   // Max 50 entries
  redoStack: []
}
```

---

## 3. The Save Flow

```
User changes anything
  ├─ Update S.data directly
  ├─ logActivity(type, description)        ← if user-facing event
  ├─ snapshot('label')                     ← if Part 2A loaded (undo support)
  ├─ buildMaps()                           ← rebuild counts + providerMap
  ├─ syncToTextarea()                      ← (atomic) writes both fields:
  │       │
  │       ├─ S.$textarea.val(JSON.stringify(S.data))                    → field_json_data
  │       └─ S.$llmConfigTextarea.val(JSON.stringify(buildLLMConfig())) → field_llm_config
  │       └─ S.dirty = true, updateSaveStatus('unsaved')
  ├─ render()                              ← re-render current view
  └─ toast(message, type)                  ← user feedback

User clicks "Save" button
  ├─ syncToTextarea()
  ├─ updateSaveStatus('saving')
  └─ S.$submitBtn.click()                  ← triggers Drupal form submit
```

**Never skip `syncToTextarea()`.** It is the only place that writes `field_llm_config`, so skipping it means consumer apps see stale config.

**Auto-save** runs every 30 seconds (Part 1 §13) and only re-syncs if `S.dirty` is true. It does NOT trigger Drupal submit — only `Ctrl+S` or the visible Save button do that.

---

## 4. LLM Config Output Contract

This is what `buildLLMConfig()` writes to `field_llm_config` and what consumer apps depend on:

```json
{
  "providers": [
    {
      "id": "gemini",
      "label": "Gemini",
      "active": true,
      "api_key": "AIza...",
      "models": [
        {
          "id": "gemini-2.5-flash",
          "label": "Gemini 2.5 Flash",
          "active": true,
          "is_default": true,
          "temperature": 0.7,
          "max_tokens": 8192,
          "top_p": 0.95
        }
      ]
    }
  ],
  "default_provider": "gemini",
  "default_model": "gemini-2.5-flash"
}
```

**Inclusion rule:** a provider is included only if `enabled && key_verified && api_key`, AND it has at least one model with `active === true`. A model is included only if `active === true`. Everything else is filtered out.

**Stripped fields** (present in `S.data` but never exported): `key_verified`, `key_verified_at`, `category`, `source`, `enabled`, `last_live_refresh`, `custom`, `test_endpoint`, `test_method`, `color`, all activity, all preferences.

Changing this contract is a breaking change for every other app on the platform.

---

## 5. Provider Catalog (`MODEL_CATALOG`)

13 built-in providers in `src/10-part1/01-constants.js`:

| Category | Providers |
|----------|-----------|
| Major (model providers) | Gemini, OpenAI, Grok, Perplexity, DeepSeek, Mistral, Cohere |
| Infrastructure (inference platforms) | Groq, GitHub Models, NVIDIA, Hugging Face, Together AI, OpenRouter |

> **Claude was removed in v0.2.0.** Anthropic's direct API requires the
> `anthropic-dangerous-direct-browser-access` header and is unreliable
> from browsers. Users who want Claude should route through OpenRouter
> (`anthropic/claude-sonnet-4` is in the OpenRouter catalog). Existing
> `claude` entries in user data are stripped by `migrateData()` on next
> load.

Each entry: `{ label, icon, category, desc, color, test_endpoint, test_method, free_tier, recommended_rank, guide, models[] }`.

### Recommended providers (`RECOMMENDED_ORDER`)

A subset of the catalog promoted on the dashboard's "Recommended Free Providers" rail:

```
['gemini', 'groq', 'huggingface', 'openrouter', 'mistral', 'deepseek', 'together']
```

Order is hand-tuned by "easiest to start with a free key" — Gemini and Groq need no credit card; Hugging Face is a generous open-model hub; OpenRouter is the recommended path to Claude/GPT-4 for browser apps.

### Provider guides (`MODEL_CATALOG[id].guide`)

Each catalog entry includes a `guide` block consumed by the full-page provider editor (right column) and the dashboard Recommended rail (free-tier note only, truncated). Shape: `{ signup_url, key_url, key_format, free_tier, steps[], troubleshooting[] }`. See `components/exports/provider-guide.component.json` for the full contract.

### Test methods (3 supported in v0.2.0)

| Method | Auth scheme | Body shape |
|--------|-------------|-----------|
| `gemini` | Query string `?key=...` | `{ contents: [{role, parts:[{text}]}], generationConfig:{ maxOutputTokens } }` |
| `cohere` | Bearer | `{ model, message, max_tokens }` (v2 endpoint) |
| `openai` | Bearer | `{ model, max_tokens, messages:[...] }` |

`openai` is the default fallback. Most providers (OpenAI-compatible, Grok, Perplexity, DeepSeek, Mistral, Groq, GitHub, NVIDIA, Hugging Face, Together, OpenRouter) use it. OpenRouter additionally adds `HTTP-Referer` + `X-Title` headers. The `claude` test method was removed alongside the Claude provider in v0.2.0.

### Custom providers

Users can add providers not in the catalog. Custom providers:

- Get `custom: true`, their own `test_endpoint`, `test_method` (defaults to `'openai'`), and a generated HSL color
- Live alongside catalog providers in `S.data.providers[]`
- Flow through every code path (editor, verify, export, refresh) **identically** to catalog providers
- For the editor, `renderProviderEditor()` synthesises a `catInfo` object from the provider's own fields. The guide column falls back to a minimal "Custom provider" info card.
- Can use Live Refresh if the endpoint exposes `/v1/models` — but custom providers are not in `MODEL_LIST_ENDPOINTS` so live refresh from the Models view is a no-op; the user gets an info toast.

---

## 6. Hash Navigation Handling

The system prompt describes a known issue with consumer apps: on a direct deep-link like `/yt-planner#scripts`, the LLM config div may not be ready when the app's JS reads it, requiring a refresh. **This issue does not apply to User Profile** because:

1. **No async data dependency.** All this app needs (form fields + user data div) is rendered server-side by Drupal before any JS runs.
2. **`readHash()` is synchronous and runs inside `migrateData()`** — view is set before render.
3. **Each view's renderer exists in Part 1** with a fallback. Even if Part 2A is still polling, Part 1's `renderModels()`/`renderProviders()` work standalone.
4. **`hashchange` handler** (Part 1 line 1284) keeps state in sync if the user changes the hash later.

You can deep-link to `/user-profile#models` and it works on first load.

### What about the Renderer Registry seam?

`renderCurrentView()` (Part 1 line 538) checks for renderers registered in `window._upRenderers`:

```javascript
case 'providers':  html = R.providers ? R.providers() : renderProviders(); break;
case 'models':     html = R.models    ? R.models()    : renderModels();    break;
```

Today neither `R.providers` nor `R.models` is registered — Part 2A only registers `openProviderModal` and `openAddCustomProviderModal`. The seam is a **public extension point** for future Parts to take over view rendering without modifying Part 1. If a future Part 2C wanted to replace the Providers view, it would call:

```javascript
window._upRenderers.providers = myNewRenderer;
window._upRenderers.setupProvidersEvents = mySetup;
window._upRender();
```

Treat `_upRenderers` as a stable API for view replacement, not as internal-only.

---

## 7. Backward Compatibility

`migrateData()` handles three migrations on every load:

1. **`enabled` field defaulting.** Old data may have providers without `enabled`. The migration sets `enabled = !!(active && key_verified)`, preserving intent for users upgrading from pre-v1.0.
2. **Missing catalog providers.** Any provider in `PROVIDER_ORDER` not yet in `S.data.providers[]` gets auto-added with `enabled: false`, empty key, full catalog model list. This means adding new providers to `MODEL_CATALOG` is forward-compatible — existing users see them on next load.
3. **Missing catalog models per provider.** Any model in `MODEL_CATALOG[id].models` not yet in `S.data.providers[i].models[]` is auto-added with `active: false`. Adding models to an existing provider is forward-compatible.

**The `active` field.** Modern code reads/writes `enabled` everywhere. `active` is mirrored from `enabled` on every save (Part 2A `saveProviderFromModal()` line 727 and elsewhere). The mirroring exists because earlier consumer code may read `active`. There is no current commitment to phase `active` out — keep mirroring it until every consumer app has migrated.

---

## 8. Key Verification Flow

```
MODAL FLOW (from provider config modal):
  User enters key in #upProviderKey → clicks Verify
    ├─ buildTestRequest(providerId, apiKey)
    │     ├─ Determines endpoint + method from catalog OR provider object
    │     ├─ Builds headers per test_method
    │     └─ Builds body with the right shape (varies per provider)
    ├─ fetch(req.endpoint, {method:'POST', headers, body})
    ├─ ON SUCCESS → onVerifySuccess(providerId, key)
    │     ├─ prov.key_verified = true
    │     ├─ prov.key_verified_at = now
    │     ├─ If first-time verify: prov.enabled = true
    │     ├─ Seed catalog models into prov.models[] if empty
    │     ├─ logActivity('key-verified', ...)
    │     ├─ buildMaps() + syncToTextarea()
    │     └─ UI: unlock Steps 2 & 3, show Save Provider button
    └─ ON FAILURE → onVerifyFailure(providerId, errorMsg)
          ├─ prov.key_verified = false
          ├─ logActivity('key-failed', ...) + buildMaps + sync
          └─ UI: error alert in #upVerifyStatus

INLINE FLOW (quick-test on provider card):
  Click test button → quickTestConnection(providerId, callback?)
    ├─ Uses same buildTestRequest()
    ├─ Shows spinner on the test button
    └─ Updates badge to ✓ or ⚠ inline, re-renders after 1.5–2.5s

BULK FLOW (Test All button):
  testAllConnections()
    ├─ Filters providers with api_key entered
    ├─ Sequentially quickTestConnection() with 500ms delay between
    └─ Toast summary at end
```

All test calls use the user's API key directly from the browser. They consume the user's API quota. They are subject to CORS — most providers explicitly allow browser calls; Anthropic requires `anthropic-dangerous-direct-browser-access: true` to opt in.

---

## 9. Live Model Refresh

```
GET /v1/models flow (8 providers supported):
  liveRefreshModels(providerId)
    ├─ Check MODEL_LIST_ENDPOINTS[providerId] — supported?
    ├─ Build headers (Bearer for most, none for OpenRouter)
    ├─ fetch GET → parseModelList() with provider-specific parser
    │     ├─ 'openai' parser: filters out embed/tts/whisper/dall-e/moderation/audio
    │     └─ 'openrouter' parser: handles their model schema
    ├─ guessCategory() for each: powerful/fast/balanced based on name heuristics
    ├─ mergeDiscoveredModels(): adds new IDs to prov.models[], skips duplicates
    └─ Toast: "N new models discovered" or "Catalog up to date"
```

Supported: openai, groq, mistral, together, openrouter, nvidia, deepseek, perplexity. The other 5 (gemini, grok, github, cohere, huggingface) don't expose a public `/v1/models` endpoint in a compatible shape — Live Refresh on them shows an info toast and is a no-op.

Newly discovered models are added with `source: 'live_refresh'` and `active: false` — the user must explicitly enable them.

---

## 10. Activity Log

Stored in `S.data.activity[]`. Capped at 200 entries (FIFO trim in `logActivity()`).

| Type | Icon | Color | When fired |
|------|------|-------|-----------|
| `provider-configured` | key | `#1a73e8` | Provider created, configured, or saved |
| `key-verified` | shield-check | `#0d904f` | API key verification succeeded |
| `key-failed` | triangle-exclamation | `#d93025` | API key verification failed |
| `model-toggled` | layer-group | `#3b82f6` | Model active state changed; bulk enable/disable; live refresh |
| `default-changed` | star | `#e37400` | Profile default or model default changed |
| `provider-removed` | trash | `#ef4444` | Provider removed or reset |
| `llm-config-synced` | refresh | `#8b5cf6` | (Reserved — not currently fired) |
| `settings-changed` | gear | `#6b7280` | Import, export, miscellaneous settings |

Activity appears in the Dashboard's "Recent Activity" panel with relative timestamps. Each entry records `user_id` + `user_name` for multi-user audit.
