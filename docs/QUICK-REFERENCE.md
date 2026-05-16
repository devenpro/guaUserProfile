# Quick Reference — User Profile App v1.0

One-page cheat sheet. For depth, see [ARCHITECTURE.md](./ARCHITECTURE.md), [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md), [API-REFERENCE.md](./API-REFERENCE.md).

## Drupal Setup

| Item | Value |
|------|-------|
| Content type | `user_profile` |
| Body class | `node--type-user-profile` |
| Field 1 | `field_json_data` (Textarea, plain text) — working state |
| Field 2 | `field_llm_config` (Textarea, plain text) — clean LLM export |

### Asset Injector Entries (all conditioned on body class `node--type-user-profile`)

| Order | Type | File |
|-------|------|------|
| 1 | CSS | `up-part1.css` |
| 2 | CSS | `up-part2.css` |
| 3 | JS | `up-part1.js` (footer) |
| 4 | JS | `up-part2a.js` (footer) |
| 5 | JS | `up-part2b.js` (footer) |

## App Identity

| Property | Value |
|----------|-------|
| CSS prefix | `up-` |
| JS prefix | `_up` |
| App container | `#upApp` |
| Content area | `#upContent` |
| Role | **Producer** of `field_llm_config` consumed by every other app |

## Views

| View | Hash | Content |
|------|------|---------|
| Dashboard | `#dashboard` | Active provider card grid + recent activity feed |
| Providers | `#providers` | All 14+ providers with filter toolbar, quick test, manage |
| Models | `#models` | Per-provider model tables with toggle, search, bulk actions |

## File Sizes (v1.0)

| File | Lines |
|------|-------|
| `up-part1.js` | 1,403 |
| `up-part2a.js` | 1,150 |
| `up-part2b.js` | 684 |
| `up-part1.css` | 334 |
| `up-part2.css` | 140 |
| **Total** | **~3,711** |

## Provider States (4 states)

| State | Indicator | In LLM Config? |
|-------|-----------|----------------|
| Unconfigured | Gray, "Not configured" | No |
| Key entered, not verified | Orange/warning border | No |
| Verified + Disabled | Gray border, dimmed, toggle off | No |
| Verified + Enabled + has active model | Blue border, green badge, toggle on | **Yes** |

## Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `buildMaps()` | Part 1 | Rebuild all counts + `providerMap` |
| `buildLLMConfig()` | Part 1 | Generate clean export JSON |
| `syncToTextarea()` | Part 1 | Write both fields + mark dirty |
| `buildTestRequest()` | Part 2A | Build fetch config for any provider |
| `quickTestConnection()` | Part 2A | Inline connectivity test |
| `openProviderModal()` | Part 2A | 3-step config modal |
| `openAddCustomProviderModal()` | Part 2A | Add user-defined provider |
| `liveRefreshModels()` | Part 2B | Fetch model list from API |
| `resetAllProviders()` | Part 2B | Clear everything (with confirm) |

## What This App Produces

`field_llm_config` JSON shape consumer apps depend on:

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

Drupal renders this into `<div class="llm-config-data">...</div>`. Consumer apps read it via `LLMService.init()`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Alt+1/2/3 | Navigate to Dashboard/Providers/Models |
| Ctrl+Shift+E | Export config (masked keys) |
| Ctrl+S | Save (Drupal submit) |
| Ctrl+Z / Ctrl+Y | Undo / Redo |
| Escape | Close modal |

## State Change Pattern (Mandatory)

```
update S.data
  → logActivity(type, desc)
  → snapshot(label)            ← Part 2A only
  → buildMaps()
  → syncToTextarea()           ← writes both Drupal fields
  → render()
  → toast(msg, type)
```

Never skip `syncToTextarea()` — it's the only place `field_llm_config` gets written.

## Data-Action Quick Reference

### Rendered in Part 1 views

`navigate`, `open-provider`, `add-custom-provider`, `provider-filter`, `toggle-provider-enabled`, `toggle-model`, `set-model-default`, `save`, `toggle-sidebar`, `toggle-activity`, `quick-test`, `test-all-connections`, `export-config`, `import-config`, `reset-all-providers`, `enable-all-models`, `disable-all-models`, `live-refresh`, `change-default`

### Handled by

- **Part 1**: 10 handlers (nav, view-level toggles, save)
- **Part 2A**: 14 handlers (modal, CRUD, verify, test) + modal-internal field events
- **Part 2B**: 8 handlers (export, import, bulk, reset, refresh)

## Providers in Catalog (14)

**Major (8):** Gemini, Claude, OpenAI, Grok, Perplexity, DeepSeek, Mistral, Cohere
**Infra (6):** Groq, GitHub Models, NVIDIA, Hugging Face, Together AI, OpenRouter

Custom providers (user-added) work identically — same modal, same test flow, same export logic.

## Live Refresh Support (8 of 14)

Providers with working `/v1/models` discovery: openai, groq, mistral, together, openrouter, nvidia, deepseek, perplexity.

Others (gemini, claude, grok, github, cohere, huggingface) get an info toast — catalog models are used as-is.
