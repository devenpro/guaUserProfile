# Component Index

Auto-generated from `components/**/*.component.json` by `scripts/build-component-index.mjs`. **Do not edit by hand** — your changes will be overwritten on the next build. Edit the source `.component.json` files and re-run the generator.

Total components: 7.

---

## Views

| Component | Summary | Entry | Source |
|---|---|---|---|
| **dashboard** | Renders the #dashboard hash route. Shows the active provider grid (one card per enabled provider with model count + key status), the welcome guide (only when zero providers configured), the Recommended Providers rail (lists unconfigured RECOMMENDED_ORDER providers — Gemini, Groq, Hugging Face, OpenRouter, Mistral, DeepSeek, Together — visible as long as ≥1 is still unconfigured), and the recent activity feed (collapsed to last 5 by default, expandable to last 50). | `renderDashboard` | [src/10-part1/09-dashboard.js:4](src/10-part1/09-dashboard.js) |
| **models** | Renders the #models hash route. Per-provider model tables with active toggle, default-star, category pill (fast/balanced/powerful), temperature & token display, fuzzy search across all models, bulk enable/disable per provider, and a live-refresh button for providers that expose /v1/models. Profile-level default-provider selector at the bottom. | `renderModels` | [src/10-part1/up-part1.js:1005](src/10-part1/up-part1.js) |
| **provider-editor** | Full-page provider configuration view at hash #provider/<id>. Replaces the v0.1.x modal-based 3-step configurator. Two-column layout: left column hosts the API-key + verify form, model selection list, and default parameter controls; right column hosts the per-provider guide (signup link, key URL, free-tier note, ordered setup steps, troubleshooting list — all sourced from MODEL_CATALOG[id].guide). Reuses the same form-field IDs as the old modal (#upProviderKey, #upParamTemp, .up-mm-toggle, .up-mm-star) so 08-events.js handlers work unchanged. Sticky action bar at the bottom of the left column hosts Cancel/Save/Remove. | `renderProviderEditor` | [src/20-part2a/04b-provider-editor-view.js:23](src/20-part2a/04b-provider-editor-view.js) |
| **providers** | Renders the #providers hash route. Full provider list with a 5-filter toolbar (all / configured / unconfigured / major / infra), inline quick-test button per row, enable/disable toggle, and a Configure/Manage button that navigates to the full-page provider editor at #provider/<id> (v0.2.0+ — previously opened a modal). | `renderProviders` | [src/10-part1/up-part1.js:878](src/10-part1/up-part1.js) |

## AI Actions

| Component | Summary | Entry | Source |
|---|---|---|---|
| **key-verify** | Verifies that a user's API key actually works against the provider's chat-completion endpoint. Performs a real round-trip with a 1-token request. Four supported test methods: 'gemini' (key in URL), 'claude' (x-api-key headers + anthropic-dangerous-direct-browser-access), 'cohere' (Bearer + v2 endpoint), 'openai' (Bearer, default — used by 11 of 14 catalog providers). | `verifyApiKey + quickTestConnection` | [src/20-part2a/up-part2a.js:386 (buildTestRequest), :440 (verifyApiKey), :482 (quickTestConnection)](src/20-part2a/up-part2a.js) |
| **live-refresh** | Discovers a provider's currently available models by calling its /v1/models endpoint, parsing the result, and merging new model IDs into S.data.providers[i].models[] with source='live_refresh' and active=false (user must explicitly enable them). Supports 8 of the 14 catalog providers (openai, groq, mistral, together, openrouter, nvidia, deepseek, perplexity). The other 6 + custom providers without an endpoint show an info toast and no-op. | `liveRefreshModels` | [src/30-part2b/up-part2b.js:99](src/30-part2b/up-part2b.js) |

## Data Exports

| Component | Summary | Entry | Source |
|---|---|---|---|
| **llm-config** | Builds the clean LLM configuration object that gets written to field_llm_config. This is the contract every other GoUltra AI app depends on — they read it from a .llm-config-data div Drupal renders into the page. Inclusion rule: a provider is included only if enabled && key_verified && api_key, AND it has at least one model with active=true. A model is included only if active=true. Sensitive working fields are stripped. | `buildLLMConfig` | [src/10-part1/up-part1.js:484](src/10-part1/up-part1.js) |

---

## Component detail

### dashboard  `view`

Renders the #dashboard hash route. Shows the active provider grid (one card per enabled provider with model count + key status), the welcome guide (only when zero providers configured), the Recommended Providers rail (lists unconfigured RECOMMENDED_ORDER providers — Gemini, Groq, Hugging Face, OpenRouter, Mistral, DeepSeek, Together — visible as long as ≥1 is still unconfigured), and the recent activity feed (collapsed to last 5 by default, expandable to last 50).

**Entry:** `renderDashboard` at `src/10-part1/09-dashboard.js:4`

**Schema source:** `components/views/dashboard.component.json`

**Triggers:**

- navigate('dashboard')
- hashchange to #dashboard
- first load with no hash
- first load with unrecognized hash

**Reads:**

- State: `S.data.providers`, `S.providerMap`, `S.activeProviders`, `S.data.activity`, `S.activityExpanded`, `S.exportableCount`, `S.verifiedCount`, `S.configuredCount`, `S.totalActiveModels`, `S.user`

**Writes:**

- DOM: `#upContent innerHTML`

**Failure modes:**

- **S.data.providers undefined or malformed** — renderCurrentView() error boundary catches the throw and replaces #upContent with .up-crash-card showing the stack trace
- **Empty activity log** — Activity panel renders an empty-state hint; not a crash
- **Zero providers configured** — Welcome guide card renders at top with a 'Start with <top-recommended>' CTA; Recommended rail below offers one-click setup for Gemini/Groq/Hugging Face/OpenRouter/Mistral/DeepSeek/Together
- **All RECOMMENDED_ORDER providers already have keys** — Recommended rail returns empty string and is omitted from the rendered output

**Tags:** `view` · `dashboard` · `activity` · `stats` · `provider-grid` · `recommended` · `welcome` · `onboarding`

**Related:** `providers`, `models`, `provider-editor`

---

### models  `view`

Renders the #models hash route. Per-provider model tables with active toggle, default-star, category pill (fast/balanced/powerful), temperature & token display, fuzzy search across all models, bulk enable/disable per provider, and a live-refresh button for providers that expose /v1/models. Profile-level default-provider selector at the bottom.

**Entry:** `renderModels` at `src/10-part1/up-part1.js:1005`

**Schema source:** `components/views/models.component.json`

**Triggers:**

- navigate('models')
- hashchange to #models
- Part-2A renderer override via window._upRenderers.models (currently no override registered)

**Reads:**

- State: `S.data.providers`, `S.providerMap`, `S.modelSearch`, `S.data.default_provider`, `S.data.default_model`, `Constants.MODEL_LIST_ENDPOINTS`

**Writes:**

- DOM: `#upContent innerHTML`

**Failure modes:**

- **Provider has zero models after live-refresh (API returned empty list)** — Empty-state row rendered with a hint to re-run live-refresh or re-enable catalog seed
- **Search debounce loses cursor position** — Existing setSelectionRange() restores cursor after re-render (in setupEventHandlers, not in renderer)

**Tags:** `view` · `models` · `search` · `bulk-toggle` · `live-refresh` · `default-model`

**Related:** `dashboard`, `providers`, `live-refresh`

---

### provider-editor  `view`

Full-page provider configuration view at hash #provider/<id>. Replaces the v0.1.x modal-based 3-step configurator. Two-column layout: left column hosts the API-key + verify form, model selection list, and default parameter controls; right column hosts the per-provider guide (signup link, key URL, free-tier note, ordered setup steps, troubleshooting list — all sourced from MODEL_CATALOG[id].guide). Reuses the same form-field IDs as the old modal (#upProviderKey, #upParamTemp, .up-mm-toggle, .up-mm-star) so 08-events.js handlers work unchanged. Sticky action bar at the bottom of the left column hosts Cancel/Save/Remove.

**Entry:** `renderProviderEditor` at `src/20-part2a/04b-provider-editor-view.js:23`

**Schema source:** `components/views/provider-editor.component.json`

**Triggers:**

- navigate('provider/<id>')
- hashchange to #provider/<id>
- click on any [data-action="open-provider"] element (dashboard active cards, Recommended rail cards, providers list cards, welcome guide CTA)

**Reads:**

- State: `S.providerMap[id]`, `S.editingProviderId`, `S.previousView`, `Constants.MODEL_CATALOG[id]`, `Constants.CATEGORY_LABELS`
- DOM: `#upProviderKey value`, `#upParamTemp value`, `#upParamTokens value`, `#upParamTopP value`, `.up-mm-toggle (per-model checkbox state)`, `.up-mm-star.up-star--on (default-model selection)`

**Writes:**

- State: `S.providerMap[id].api_key (via key-verify handler)`, `S.providerMap[id].key_verified, key_verified_at (via verify-key handler)`, `S.providerMap[id].models[*].active, is_default, temperature, max_tokens, top_p (on save)`, `S.providerMap[id].enabled, active (on save / verify)`, `S.data.default_provider, default_model (auto-assigned on first save when none exists)`, `S.previousView, S.currentView, S.editingProviderId (via navigate)`
- DOM: `#upContent innerHTML (full re-render via renderCurrentView)`, `window.location.hash`

**Failure modes:**

- **Provider id in URL does not exist in S.providerMap** — navigate() falls back to 'dashboard'. If the route is reached directly (e.g. bookmark to a retired provider like #provider/claude), renderProviderEditor renders a 'Provider not found' empty state with a Back-to-Providers button.
- **Custom provider with no MODEL_CATALOG entry** — Synthesises a catInfo from prov.* fields and renders a fallback 'Custom provider' card in place of the guide column.
- **Part 2A not yet loaded when renderCurrentView dispatches to R.providerEditor** — 06-navigation.js falls back to a 'Loading editor…' empty state until Part 2A registers the renderer and triggers its own render().
- **Key verify failed but user clicked Save** — Save button is disabled until key_verified is true (visible in the editor as a disabled button with a 'Verify the API key first' tooltip).

**Tags:** `view` · `provider-editor` · `configuration` · `guide` · `full-page` · `hash-route`

**Related:** `dashboard`, `providers`, `models`, `key-verify`

---

### providers  `view`

Renders the #providers hash route. Full provider list with a 5-filter toolbar (all / configured / unconfigured / major / infra), inline quick-test button per row, enable/disable toggle, and a Configure/Manage button that navigates to the full-page provider editor at #provider/<id> (v0.2.0+ — previously opened a modal).

**Entry:** `renderProviders` at `src/10-part1/up-part1.js:878`

**Schema source:** `components/views/providers.component.json`

**Triggers:**

- navigate('providers')
- hashchange to #providers
- Part-2A renderer override via window._upRenderers.providers (currently no override registered)

**Reads:**

- State: `S.data.providers`, `S.providerFilter`, `S.providerMap`, `Constants.MODEL_CATALOG`, `S.exportableCount`

**Writes:**

- DOM: `#upContent innerHTML`

**Failure modes:**

- **S.providerMap stale (buildMaps() not called after a mutation)** — Some cards render with wrong counts but page is functional; renderCurrentView() error boundary catches harder failures
- **Custom provider missing test_endpoint** — Quick-test button is disabled in the row, with an info toast on click

**Tags:** `view` · `providers` · `filter-toolbar` · `quick-test` · `enable-toggle`

**Related:** `dashboard`, `models`, `provider-editor`, `key-verify`

---

### key-verify  `ai-action`

Verifies that a user's API key actually works against the provider's chat-completion endpoint. Performs a real round-trip with a 1-token request. Four supported test methods: 'gemini' (key in URL), 'claude' (x-api-key headers + anthropic-dangerous-direct-browser-access), 'cohere' (Bearer + v2 endpoint), 'openai' (Bearer, default — used by 11 of 14 catalog providers).

**Entry:** `verifyApiKey + quickTestConnection` at `src/20-part2a/up-part2a.js:386 (buildTestRequest), :440 (verifyApiKey), :482 (quickTestConnection)`

**Schema source:** `components/ai-actions/key-verify.component.json`

**Triggers:**

- Click [data-action='verify-key'] in the provider config modal (Part 2A §5)
- Click [data-action='quick-test'] on a provider card (Part 2A inline)
- Click [data-action='test-all-connections'] in the Providers view (Part 2A bulk)

**Reads:**

- State: `S.providerMap[providerId]`, `S.providerMap[providerId].api_key`, `Constants.MODEL_CATALOG[providerId].test_endpoint`, `Constants.MODEL_CATALOG[providerId].test_method`
- DOM: `#upProviderKey value`, `#upVerifyStatus container`
- Network: `POST <test_endpoint> with provider-specific headers + body`

**Writes:**

- State: `S.providerMap[providerId].key_verified (boolean)`, `S.providerMap[providerId].key_verified_at (ISO timestamp)`, `S.providerMap[providerId].enabled (set to true on FIRST successful verify only)`
- DOM: `#upVerifyStatus alert HTML (success | error)`, `Provider card badge updates on bulk/quick path`

**Network contract:**

```json
{
  "method": "POST",
  "endpoint_pattern": "<provider-specific, from MODEL_CATALOG.test_endpoint>",
  "headers": {
    "gemini": "Query param ?key=<key>",
    "claude": "x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access",
    "cohere": "Authorization: Bearer <key> (v2 endpoint)",
    "openai": "Authorization: Bearer <key> (default fallback)"
  },
  "body_shape": "Minimal 1-message chat request with max_tokens=1 (or generationConfig.maxOutputTokens=1 for gemini)",
  "response_shape": "Provider-specific; success = HTTP 2xx regardless of body. Failure = HTTP 4xx/5xx or fetch error."
}
```

**Failure modes:**

- **CORS blocked by provider** — fetch() rejects; error toast shown; key_verified stays false. Anthropic specifically requires anthropic-dangerous-direct-browser-access: true to opt in.
- **Invalid key** — HTTP 401/403; onVerifyFailure() called with the response message; key_verified flipped to false; logActivity('key-failed', ...)
- **Provider down / network error** — Error toast; key_verified untouched (preserves last-known-good state). Logs to console with [UP] prefix.
- **Rate-limit (429)** — Treated as failure; toast suggests retry. No automatic backoff.

**Tags:** `ai-action` · `verification` · `fetch` · `cors` · `api-key`

**Related:** `providers`, `live-refresh`

---

### live-refresh  `ai-action`

Discovers a provider's currently available models by calling its /v1/models endpoint, parsing the result, and merging new model IDs into S.data.providers[i].models[] with source='live_refresh' and active=false (user must explicitly enable them). Supports 8 of the 14 catalog providers (openai, groq, mistral, together, openrouter, nvidia, deepseek, perplexity). The other 6 + custom providers without an endpoint show an info toast and no-op.

**Entry:** `liveRefreshModels` at `src/30-part2b/up-part2b.js:99`

**Schema source:** `components/ai-actions/live-refresh.component.json`

**Triggers:**

- Click [data-action='live-refresh'] in the Models view (per-provider button)
- Click [data-action='live-refresh-modal'] in the provider config modal

**Reads:**

- State: `S.providerMap[providerId]`, `S.providerMap[providerId].api_key`, `S.providerMap[providerId].key_verified`, `MODEL_LIST_ENDPOINTS[providerId] (local const in Part 2B §2)`
- Network: `GET <MODEL_LIST_ENDPOINTS[providerId].url> with Bearer auth (or none for openrouter)`

**Writes:**

- State: `S.providerMap[providerId].models[] (merge-only — never deletes existing models)`, `S.providerMap[providerId].last_live_refresh (ISO timestamp)`, `S.data.activity[] (model-toggled entry on each newly-added model)`
- DOM: `Refresh button spinner state on the originating control`

**Network contract:**

```json
{
  "method": "GET",
  "endpoint_pattern": "https://<provider-host>/v1/models (varies by provider)",
  "headers": {
    "default": "Authorization: Bearer <api_key>",
    "openrouter": "(no auth required; HTTP-Referer header added)"
  },
  "response_parsers": {
    "openai": "Reads data.data[].id and data.data[].name. Filters out embedding/moderation/tts/whisper/dall-e/audio models by ID substring.",
    "openrouter": "Reads data.data[].id and data.data[].name. No filter."
  },
  "category_guessing": "guessCategory() heuristic: keywords 'opus|pro|large|405b|grok-3|r1|o3|o1|deep-research' → powerful; 'mini|nano|flash|lite|8b|small|haiku|instant' → fast; everything else → balanced."
}
```

**Failure modes:**

- **Provider not in MODEL_LIST_ENDPOINTS (e.g., claude, gemini, github, cohere, huggingface, grok)** — Info toast: '<provider> does not support live model refresh. Using catalog models.' No-op.
- **key_verified is false or api_key is empty** — Warning toast: 'Provider not configured or key not verified'. No-op.
- **Network error / 4xx / 5xx** — Error toast with the message; refresh button re-enabled; existing models[] preserved (never destructive).
- **Parser returns empty list** — Toast: 'Catalog up to date' (treated as success — no new models found).
- **API returns models with duplicate IDs** — mergeDiscoveredModels() skips duplicates by ID (existing entry wins; its active/is_default/temperature etc. are preserved).

**Tags:** `ai-action` · `discovery` · `fetch` · `models-api` · `merge`

**Related:** `models`, `key-verify`, `llm-config`

---

### llm-config  `data-export`

Builds the clean LLM configuration object that gets written to field_llm_config. This is the contract every other GoUltra AI app depends on — they read it from a .llm-config-data div Drupal renders into the page. Inclusion rule: a provider is included only if enabled && key_verified && api_key, AND it has at least one model with active=true. A model is included only if active=true. Sensitive working fields are stripped.

**Entry:** `buildLLMConfig` at `src/10-part1/up-part1.js:484`

**Schema source:** `components/exports/llm-config.component.json`

**Triggers:**

- syncToTextarea() — called on every state mutation (save flow step 5)
- Auto-save loop (every 30s when S.dirty=true)
- User clicks Save button [data-action='save']
- Ctrl+S keyboard shortcut
- Live-refresh completion
- Provider config modal save

**Reads:**

- State: `S.data.providers (entire array)`, `S.data.default_provider`, `S.data.default_model`

**Writes:**

- DOM: `field_llm_config textarea value (via syncToTextarea)`

**Output contract:**

```json
{
  "shape": {
    "providers": "Array<{id, label, active, api_key, models: Array<{id, label, active, is_default, temperature, max_tokens, top_p}>}>",
    "default_provider": "string (provider id) or empty string",
    "default_model": "string (model id) or empty string"
  },
  "stripped_fields": [
    "key_verified",
    "key_verified_at",
    "category",
    "source",
    "enabled",
    "last_live_refresh",
    "custom",
    "test_endpoint",
    "test_method",
    "color",
    "activity (entire array)",
    "preferences (entire object)"
  ],
  "consumers": "Every other app on the GoUltra AI platform. Listed in docs/PROJECT.md.",
  "spec_doc": "docs/ARCHITECTURE.md §4"
}
```

**Failure modes:**

- **S.data.providers is null or not an array** — Returns { providers: [], default_provider: '', default_model: '' } — consumers see empty config, which is the safe default
- **A provider with key_verified=true but enabled=false** — Excluded from export. Consumers do not see the provider until enabled is also true.
- **default_provider points at a provider that fails the inclusion rule** — default_provider is still emitted as-is; consumers must validate against their parsed providers list. Future improvement: nullify default_provider in this case.

> ⚠ **Breaking change risk:** Any change to the output shape is a breaking change for EVERY OTHER APP on the platform. See CLAUDE.md 'What Claude will not do' list.

**Tags:** `data-export` · `contract` · `platform-critical` · `field-llm-config`

**Related:** `providers`, `models`, `key-verify`

---

