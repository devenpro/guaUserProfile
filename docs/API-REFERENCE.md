# API Reference — User Profile App v1.0

All public globals, registry hooks, and the output contract that consumer apps depend on.

---

## Part 1 Exports (`window._up*`)

Part 1 sets **25 globals** on `window` at the end of init (Part 1 §15, lines 1365–1399).

### State

| Global | Type | Description |
|--------|------|-------------|
| `window._upState` | Object | Full state object `S` — see [ARCHITECTURE.md §2](./ARCHITECTURE.md#2-state-object-s) |
| `window._upConstants` | Object | `{ APP_VIEWS, MODEL_CATALOG, PROVIDER_ORDER, ACTIVITY_TYPES, CATEGORY_LABELS }` |
| `window._upRenderers` | Object | Renderer registry — see [§Renderer Registry](#renderer-registry-window_uprenderers) below |

### Core Functions

| Global | Signature | Description |
|--------|-----------|-------------|
| `_upRender` | `()` | Re-renders the current view into `#upContent` |
| `_upNavigate` | `(viewId)` | Navigate to view: `'dashboard'`, `'providers'`, `'models'` |
| `_upToast` | `(msg, type?, duration?)` | Show toast. Types: `'success'`, `'error'`, `'warning'`, `'info'`. Default duration 3000ms |
| `_upGenerateId` | `(prefix?)` | Returns `prefix + '_' + base36(timestamp) + base36(random)` |
| `_upBuildMaps` | `()` | Rebuilds `providerMap`, `activeProviders`, and all 5 counts |
| `_upSyncToTextarea` | `()` | Writes `S.data` → `field_json_data`, `buildLLMConfig()` → `field_llm_config`, marks dirty |
| `_upUpdateSaveStatus` | `(status)` | Updates the "Saved/Saving/Unsaved" header indicator. Status: `'saving'`, `'saved'`, `'unsaved'` |
| `_upLogActivity` | `(type, description)` | Push entry to `S.data.activity[]`. Caps at 200 entries. See [Activity Types](#activity-types) |
| `_upBuildLLMConfig` | `()` | Returns clean config object — see [Output Contract](#llm-config-output-contract) |

### Utilities

| Global | Signature | Description |
|--------|-----------|-------------|
| `_upEsc` | `(str)` | HTML-escape: `&`, `<`, `>`, `"`, `'` |
| `_upIcon` | `(name, className?)` | Returns Font Awesome HTML for a named icon. ~60 mappings (e.g., `'bolt'` → `fa-bolt`). Unknown names fall through to `fa-${name}` |
| `_upDeepClone` | `(obj)` | `JSON.parse(JSON.stringify(obj))` |
| `_upTruncate` | `(str, max?)` | Truncate with ellipsis (default 50 chars) |
| `_upMaskKey` | `(key)` | Returns `'••••••••' + key.slice(-4)`, or `'••••••••'` if key < 6 chars |
| `_upDebounce` | `(fn, ms?)` | Debounce wrapper (default 250ms) |
| `_upIsEmpty` | `(obj)` | Null/empty check for objects and arrays |

### Formatters

| Global | Signature | Description |
|--------|-----------|-------------|
| `_upFormatDate` | `(isoStr)` | Returns `"Jan 15, 2026"` format |
| `_upFormatRelativeTime` | `(isoStr)` | Returns `"just now"`, `"5 min ago"`, `"2 days ago"`; falls back to `_upFormatDate` for > 30 days |

### Getters

| Global | Signature | Description |
|--------|-----------|-------------|
| `_upGetRecentActivity` | `(n?)` | Returns last N activity entries (newest first). Omit `n` for all |
| `_upGetFilteredProviders` | `()` | Returns providers filtered by `S.providerFilter` (`all`/`configured`/`unconfigured`/`major`/`infra`) |
| `_upGetProviderColor` | `(providerId)` | Returns `MODEL_CATALOG[id].color` or fallback `'#6b7280'` |
| `_upCategoryPill` | `(category)` | Returns HTML pill markup for `'fast'`/`'balanced'`/`'powerful'` |

---

## Part 2A Exports (`window._upPart2A`)

15 methods, registered after Part 2A's `setupPart2AEvents()` completes (~10s timeout from Part 1 ready).

| Method | Signature | Description |
|--------|-----------|-------------|
| `snapshot` | `(label?)` | Push undo snapshot. Stack capped at 50 entries |
| `undo` | `()` | Restore previous snapshot, push current to redo stack |
| `redo` | `()` | Restore from redo stack |
| `openModal` | `(title, content, options?)` | Open modal. Options: `size`, `headerIcon`, `headerIconColor`, `subtitle`, `saveLabel`, `footerLeft`, `footer`, `onSave` |
| `closeModal` | `()` | Close current modal, clear `currentModal` reference |
| `openConfirmDialog` | `({ title, message, confirmLabel?, danger?, onConfirm })` | Yes/no dialog |
| `closeConfirmDialog` | `()` | Programmatically close confirm dialog |
| `openProviderModal` | `(providerId)` | Open 3-step config modal: key → models → params. Works for catalog AND custom providers (synthesizes `catInfo` for customs) |
| `saveProviderFromModal` | `(providerId?)` | Collect form fields, save provider, auto-assign profile default if none exists |
| `removeProvider` | `(providerId)` | Confirm dialog → clear key/models/enabled, reassign profile default to next eligible provider |
| `openChangeDefaultModal` | `()` | Provider + model dropdowns for profile default |
| `openAddCustomProviderModal` | `()` | Modal: name, ID (auto-derived from name), endpoint URL, API key → creates custom provider + auto-verifies |
| `verifyApiKey` | `(providerId)` | Modal verification — reads key from `#upProviderKey` input, calls `buildTestRequest`, updates UI |
| `quickTestConnection` | `(providerId, callback?)` | Inline test without modal. Callback signature: `(success: boolean) => void` |
| `testAllConnections` | `()` | Sequentially calls `quickTestConnection` on every provider with a key entered, 500ms apart |

---

## Part 2B Exports (`window._upPart2B`)

9 methods, registered after Part 2B's setup completes (~15s timeout from Part 1 ready).

| Method | Signature | Description |
|--------|-----------|-------------|
| `liveRefreshModels` | `(providerId)` | GET the provider's `/v1/models` (if supported), merge discovered models with `source: 'live_refresh'` |
| `openLLMConfigPreview` | `()` | 3-tab preview modal: JSON view, HTML output, consumers list. (Available but no built-in UI trigger currently) |
| `exportJSON` | `()` | Download config as `user-profile-config-YYYY-MM-DD.json` with API keys **masked** |
| `exportJSONWithKeys` | `()` | Confirm dialog → download config with **unmasked** API keys |
| `importJSON` | `()` | File picker → validate → confirm dialog → replace `S.data`. Masked keys are stripped during import |
| `enableAllModels` | `(providerId)` | Set `active: true` on every model for a provider |
| `disableAllModels` | `(providerId)` | Set `active: false` on every model for a provider |
| `resetAllProviders` | `()` | Confirm dialog → clear all keys, disable all models, clear profile defaults |
| `clearActivityLog` | `()` | Confirm dialog → empty `S.data.activity[]` |

---

## Renderer Registry (`window._upRenderers`)

A public extension point for replacing view renderers without modifying Part 1.

**Currently registered by Part 2A:**

| Key | Type | Called by |
|-----|------|----------|
| `openProviderModal` | `(providerId) => void` | Part 1 click handler for `data-action="open-provider"` |
| `openAddCustomProviderModal` | `() => void` | Part 1 click handler for `data-action="add-custom-provider"` |

**Available but unused — extension seam for future Parts:**

| Key | Type | Called by |
|-----|------|----------|
| `providers` | `() => string` (HTML) | `renderCurrentView()` for `S.currentView === 'providers'` |
| `models` | `() => string` (HTML) | `renderCurrentView()` for `S.currentView === 'models'` |
| `setupProvidersEvents` | `() => void` | After rendering the providers view |
| `setupModelsEvents` | `() => void` | After rendering the models view |

To replace the Providers view from a future Part:

```javascript
window._upRenderers.providers = function() { return '<div>...</div>'; };
window._upRenderers.setupProvidersEvents = function() { /* delegated handlers */ };
window._upRender();  // trigger re-render
```

When `R.providers` is absent, Part 1 falls back to its own `renderProviders()`. The same pattern applies to `models`. Dashboard has no registry seam — it's always rendered by Part 1.

---

## LLM Config Output Contract

`buildLLMConfig()` writes this exact JSON shape into `field_llm_config` on every `syncToTextarea()`. Every consumer app on the platform reads it via the `.llm-config-data` div. **Changing this shape is a breaking change for every app.**

```typescript
{
  providers: Array<{
    id: string;             // Lowercase provider ID
    label: string;          // Display name
    active: true;           // Always true (filtered)
    api_key: string;        // Plaintext — consumers use this to authenticate
    models: Array<{
      id: string;
      label: string;
      active: true;         // Always true (filtered)
      is_default: boolean;  // Provider-level default (one per provider, or zero)
      temperature: number;  // 0–2 typical, stored 0–1 in app but consumers may rescale
      max_tokens: number;
      top_p: number;        // 0–1
    }>;
  }>;
  default_provider: string;  // Empty string if none set
  default_model: string;     // Empty string if none set
}
```

**Inclusion rule:** a provider appears only if `enabled && key_verified && api_key && (at least one model with active === true)`. A model appears only if `active === true`.

**Stripped from `S.data`:** `key_verified`, `key_verified_at`, `category`, `source`, `enabled`, `last_live_refresh`, `custom`, `test_endpoint`, `test_method`, `color`, all `activity`, all `preferences`.

---

## Activity Types

Defined in `ACTIVITY_TYPES` (Part 1 §1). 8 types currently:

| Type | Icon | Color | When fired |
|------|------|-------|-----------|
| `provider-configured` | `key` | `#1a73e8` | Provider saved with new config; custom provider added |
| `key-verified` | `shield-check` | `#0d904f` | API key verification succeeded |
| `key-failed` | `triangle-exclamation` | `#d93025` | API key verification failed |
| `model-toggled` | `layer-group` | `#3b82f6` | Model active state changed; bulk enable/disable; live refresh new models |
| `default-changed` | `star` | `#e37400` | Profile default or per-provider default changed |
| `provider-removed` | `trash` | `#ef4444` | Provider cleared; "Start Fresh" reset |
| `llm-config-synced` | `refresh` | `#8b5cf6` | (Reserved — not currently fired in code) |
| `settings-changed` | `gear` | `#6b7280` | Import, export, miscellaneous settings changes |

Activity entry shape:

```javascript
{
  id: 'act_<base36 timestamp>_<random>',
  type: 'one of the above',
  description: 'Free-text description',
  timestamp: 'ISO 8601',
  user_id: 'from S.user.id',
  user_name: 'from S.user.fullName || S.user.name'
}
```

---

## Data-Action Events

The app uses `data-action="..."` attributes on every interactive element. Handlers are delegated.

### Rendered in Part 1 views

`navigate`, `open-provider`, `add-custom-provider`, `provider-filter`, `toggle-provider-enabled`, `toggle-model`, `set-model-default`, `save`, `toggle-sidebar`, `toggle-activity`, `quick-test`, `test-all-connections`, `export-config`, `import-config`, `reset-all-providers`, `enable-all-models`, `disable-all-models`, `live-refresh`, `change-default`

### Handled by

| Part | Actions |
|------|---------|
| Part 1 | `navigate`, `toggle-sidebar`, `save`, `provider-filter`, `toggle-provider-enabled`, `open-provider` (delegates to Part 2A renderer), `add-custom-provider` (delegates to Part 2A renderer), `toggle-model`, `set-model-default`, `toggle-activity` |
| Part 2A | `close-modal`, `modal-save`, `verify-key`, `confirm-ok`, `confirm-cancel`, `remove-provider`, `change-default`, `quick-test`, `test-all-connections`, plus modal-internal events: `.up-mm-toggle change`, `.up-mm-star click`, `#upParamTemp input`, `#upParamTopP input`, `#upDefaultProvider change`, `#upCustomName input`, `#upCustomId input`, `#upProviderKey keydown` |
| Part 2B | `export-config`, `export-config-keys`, `import-config`, `enable-all-models`, `disable-all-models`, `reset-all-providers`, `clear-activity`, `live-refresh`, `live-refresh-modal` |

---

## Keyboard Shortcuts (Part 2A + 2B)

| Shortcut | Action | Provided by |
|----------|--------|-------------|
| Alt+1 | Navigate to Dashboard | Part 2B |
| Alt+2 | Navigate to Providers | Part 2B |
| Alt+3 | Navigate to Models | Part 2B |
| Ctrl+Shift+E (Cmd+Shift+E) | Export config (masked keys) | Part 2B |
| Ctrl+S (Cmd+S) | Save — calls Drupal submit | Part 2B |
| Ctrl+Z (Cmd+Z) | Undo | Part 2A |
| Ctrl+Y / Ctrl+Shift+Z (Cmd+Y / Cmd+Shift+Z) | Redo | Part 2A |
| Escape | Close modal or confirm dialog | Part 2A |

All shortcuts ignore key events fired inside `input`, `textarea`, `select`, or `[contenteditable="true"]`.

---

## CSS Variables (subset most useful in JS)

These are documented fully in [STYLE-REFERENCE.md](./STYLE-REFERENCE.md). When generating inline styles from JS, use the variables:

```javascript
'background: var(--up-primary)'
'color: var(--up-text-muted)'
'box-shadow: var(--up-shadow-md)'
```

**Never hardcode hex colors in JS** unless they come from `MODEL_CATALOG[id].color` (provider brand colors) or `ACTIVITY_TYPES[type].color` (activity feed dots).
