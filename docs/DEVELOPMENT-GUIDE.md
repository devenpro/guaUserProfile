# Development Guide — User Profile App v1.0

## The Save Flow Pattern (Mandatory)

Every user action that changes state must follow this exact sequence:

```javascript
// 1. Modify S.data directly
S.data.providers[i].someField = newValue;

// 2. Log activity if user-facing
logActivity('type', 'What happened');

// 3. Snapshot for undo (Part 2A only)
snapshot('Label for undo stack');

// 4. Rebuild lookup maps + counts
buildMaps();

// 5. Sync to both Drupal fields (THIS IS WHAT WRITES field_llm_config)
syncToTextarea();

// 6. Re-render UI
render();          // or renderCurrentView()

// 7. User feedback
toast('Success message', 'success');
```

**Never skip `syncToTextarea()`.** It is the only function that writes `field_llm_config`. If you forget it, every other app on the platform sees stale AI config.

---

## Adding a New Catalog Provider

1. Add to `MODEL_CATALOG` in Part 1 §1:

   ```javascript
   'newprovider': {
     label: 'New Provider',
     icon: 'sparkles',           // From icon() helper map
     category: 'major',          // or 'infra'
     desc: 'One-line description',
     color: '#HEX',
     test_endpoint: 'https://api.example.com/v1/chat/completions',
     test_method: 'openai',      // or 'gemini', 'cohere'
     free_tier: false,           // true if the provider offers free API keys
     recommended_rank: null,     // 1-N to promote on the dashboard rail, or null
     guide: {                    // Optional but recommended — populates the editor's right column
       signup_url: 'https://...',
       key_url: 'https://...',
       key_format: 'Starts with "abc-".',
       free_tier: 'Note about pricing / free quota.',
       steps: [
         { title: 'Step 1', body: 'Describe step 1.' }
       ],
       troubleshooting: [
         { issue: 'Common error', fix: 'How to fix.' }
       ]
     },
     models: [
       { id: 'model-id', label: 'Model Name', category: 'balanced',
         default_temp: 0.7, max_tokens: 8192 }
     ]
   }
   ```

2. Add the ID to `PROVIDER_ORDER` (controls iteration + display order).
3. If you want the provider promoted on the dashboard's Recommended Free Providers rail, also add the ID to `RECOMMENDED_ORDER`.
4. If the icon name isn't in `icon()`'s map, add it (Part 1 §7 utilities).
5. If the provider supports `/v1/models`, add it to `MODEL_LIST_ENDPOINTS` in Part 2B §2.
6. `migrateData()` automatically seeds the new provider for existing users on next page load — no migration script needed.
7. **Test**: load a node, navigate to Providers view, confirm the new provider appears in the list. Click Configure, the full-page editor opens at `#provider/<id>` with the guide panel on the right. Enter a key, hit Verify.

---

## Removing or retiring a provider

Add an entry to `REMOVED_PROVIDERS` in Part 1 §1 (key = provider id, value = removal reason). `migrateData()` strips matching entries from `S.data.providers[]` on next load, logs the removal in the activity feed, and clears the profile default if it pointed at the retired provider. The user's stored data IS modified; this is destructive. Document the change as BREAKING in the CHANGELOG because consumer apps reading `field_llm_config` will see the provider disappear.

The historical Claude removal in v0.2.0 is the reference example.

---

## Adding a New Test Method

Used when a provider has an auth pattern not covered by `gemini`/`cohere`/`openai`.

1. Add a new `case` to `buildTestRequest()` in Part 2A §5:

   ```javascript
   case 'my-method':
     endpoint += '?token=' + encodeURIComponent(apiKey);  // or whatever
     headers = { 'Content-Type': 'application/json', 'X-Custom-Auth': apiKey };
     body = JSON.stringify({ /* provider's expected payload */ });
     break;
   ```

2. Reference it in the provider's `MODEL_CATALOG` entry: `test_method: 'my-method'`.
3. **Test**: enter a real key, click Verify, check Network tab for the request shape, confirm 2xx response triggers `onVerifySuccess`.

---

## Adding a New View

1. Add to `APP_VIEWS` in Part 1 §1:

   ```javascript
   'newview': { order: 4, label: 'New View', icon: 'icon-name', description: '...' }
   ```

2. Write `renderNewView()` in Part 1. Follow existing view patterns (header → toolbar → content → empty state).
3. Add a `case` to `renderCurrentView()` switch (Part 1 §6).
4. Sidebar nav auto-generates from `APP_VIEWS`.
5. If you want to allow future Parts to take over, also add the registry check:

   ```javascript
   case 'newview':  html = R.newview ? R.newview() : renderNewView(); break;
   if (S.currentView === 'newview' && R.setupNewviewEvents) R.setupNewviewEvents();
   ```

---

## Adding an Event Handler

**Always** use delegated events with unique namespaces. The DOM is rebuilt on every render — non-delegated handlers will detach.

```javascript
$(document).off('click.up-xx', '[data-action="my-action"]')
  .on('click.up-xx', '[data-action="my-action"]', function(e) {
    e.preventDefault();
    // handler code
  });
```

Where to place:

| Part | Scope |
|------|-------|
| Part 1 | View-level interactions: nav, filter, toggle, model on/off, save |
| Part 2A | Modal interactions: open, close, save, verify, CRUD, undo/redo |
| Part 2B | Advanced features: export, import, bulk ops, reset, live refresh |

---

## Adding an Activity Type

1. Add to `ACTIVITY_TYPES` in Part 1 §1:

   ```javascript
   'new-type': { icon: 'icon-name', color: '#hex' }
   ```

2. Call `logActivity('new-type', 'Description of what happened')` from wherever the event fires.
3. The Dashboard's activity feed auto-displays it with the configured icon and color.

---

## Using Global Resources

### User Info

Already parsed into `S.user` at init. Use directly:

```javascript
var userName = S.user.fullName || S.user.name;
var userId = S.user.id;
var userTz = S.user.timezone;
```

For activity attribution, `logActivity()` already populates `user_id` and `user_name` automatically.

### AI Configuration

This app **produces** AI config, doesn't consume it. To programmatically inspect what consumer apps will see:

```javascript
var configToBeExported = window._upBuildLLMConfig();
console.log(configToBeExported.providers.length, 'providers will be exported');
```

For internal logic that needs to know "is this provider active and exportable":

```javascript
var prov = S.providerMap[providerId];
var isExportable = prov && prov.enabled && prov.key_verified && prov.api_key &&
                   (prov.models || []).some(function(m) { return m.active; });
```

`S.activeProviders[]` and `S.exportableCount` are kept up to date by `buildMaps()` for the same purpose.

### Brand Context

Not used by this app. If you want to add brand-driven theming later, the integration point is `renderApp()` in Part 1 §8 — parse `.brand-data` once, store on `S.brand`, then apply CSS variables or class names from the parsed data.

---

## Hash Navigation in This App

Direct deep-links like `/user-profile#models` work on first load — see [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-hash-navigation-handling) for why. You generally don't need to do anything special.

The two things to **not break**:

1. `readHash()` must run inside `migrateData()` before `renderApp()` — moving it later would break first-load deep-links.
2. The `hashchange` handler at the end of `setupEventHandlers()` keeps state in sync if the URL hash changes externally (back/forward buttons). Don't remove it.

When adding a new view, make sure its key is in `APP_VIEWS` — `readHash()` validates against that map.

---

## Building a New App on This Platform

This app's patterns are reusable for other content types on the same platform.

### What stays the same

- IIFE pattern with `jQuery + Drupal`
- 3-part JS + 2-part CSS structure
- Init chain (Part 1 → 2A → 2B with polling)
- Window globals export pattern
- Event delegation with unique namespaces
- `syncToTextarea()` save flow concept
- Icon helper, toast, modal system, confirm dialog
- CSS variable design system
- Activity log pattern
- Undo/redo if needed (Part 2A)

### What changes per app

- Content type name + body class (`node--type-XXX`)
- CSS prefix (e.g., `scp-`, `vp-`, `gtm-`)
- JS prefix (e.g., `_scp`, `_vp`, `_gtm`)
- Number of Drupal fields (2 or 3)
- Whether the app **consumes** `.llm-config-data` (most apps do; User Profile doesn't)
- Whether the app reads `.brand-data` (most apps do; User Profile doesn't)
- `APP_VIEWS` + view renderers
- Data model inside `S.data` (and `S.meta` for 3-field apps)
- App-specific constants (statuses, types, categories)

### Checklist for new apps

1. Define content type + body class
2. Choose prefix (CSS + JS) — must be unique
3. Decide field count: 2 (like User Profile) or 3 (standard: data + meta + activity)
4. Decide if you consume `.llm-config-data` → if yes, implement `LLMService.init()` properly and handle the hash-navigation issue
5. Decide if you read `.brand-data` → if yes, parse on init
6. List all views + their layouts
7. Define constants (statuses, types, categories)
8. Build Part 1: shell + state + views + events + exports
9. Build Part 2A: modals + CRUD + undo/redo
10. Build Part 2B: advanced features (AI, import/export, etc.)
11. Build CSS: design tokens + shell + views + modals
12. Create sample JSON files
13. Validate: `node -c` + prefix audit + action wiring audit

---

## Common Patterns

### Filtering

```javascript
function getFilteredItems() {
  var items = S.data.items || [];
  switch (S.filter) {
    case 'active':   return items.filter(function(i) { return i.active; });
    case 'category': return items.filter(function(i) { return i.cat === S.filterValue; });
    default:         return items;
  }
}
```

### Debounced Search (preserves cursor position)

```javascript
$(document).off('input.up-search', '.up-search-input').on('input.up-search', '.up-search-input', debounce(function() {
  var cursorPos = this.selectionStart;
  S.searchTerm = $(this).val() || '';
  renderCurrentView();
  var $newInput = $('.up-search-input');
  if ($newInput.length) {
    $newInput.focus();
    try { $newInput[0].setSelectionRange(cursorPos, cursorPos); } catch (e) {}
  }
}, 300));
```

### Modal with Form

```javascript
openModal('Title', formHtml, {
  size: 'md',                // 'sm' | 'md' | 'lg'
  headerIcon: 'gear',        // Optional FA icon name
  headerIconColor: '#1a73e8',
  subtitle: 'Optional subtitle',
  saveLabel: 'Save',         // Or false to hide
  footerLeft: '<button ...>Delete</button>',  // Optional left-aligned footer content
  onSave: function() {
    var val = $('#myField').val().trim();
    if (!val) { toast('Required', 'warning'); return; }
    // save logic
    closeModal();
  }
});
```

### Confirm Dialog

```javascript
openConfirmDialog({
  title: 'Are you sure?',
  message: 'This cannot be undone.',
  confirmLabel: 'Delete',
  danger: true,
  onConfirm: function() { /* destructive action */ }
});
```

### Provider State Check

```javascript
function getProviderState(providerId) {
  var p = S.providerMap[providerId];
  if (!p) return 'missing';
  if (!p.api_key) return 'unconfigured';
  if (!p.key_verified) return 'key-entered';
  if (!p.enabled) return 'verified-disabled';
  var activeModels = (p.models || []).filter(function(m) { return m.active; });
  if (activeModels.length === 0) return 'enabled-no-models';
  return 'exportable';
}
```

---

## Validation Checklist

Before delivering production files:

1. `node -c file.js` for all three JS files (syntax check)
2. Zero prefix leaks: `grep -E '\b(scp|vp|gtm|lbwp|yvp)-' up-*.css` should return nothing
3. Every `data-action="..."` in HTML has at least one `on(...., '[data-action="..."]', ...)` handler
4. Every `.off('event.ns', ...).on('event.ns', ...)` pair uses a **unique** namespace string
5. Init chain verified: body class → Part 1 logs → Part 2A logs → Part 2B logs in console, in order
6. No hardcoded colors in CSS — `grep -E '#[0-9a-fA-F]{3,8}' up-*.css` flagged values should all be inside the `:root` block or `MODEL_CATALOG` color literals
7. Sample JSON parses cleanly and renders without errors
8. CHANGELOG.md updated with the change
