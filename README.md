# User Profile

Drupal 11 add-on for the GoUltra AI platform: per-user AI provider configuration. Manages API keys, model selections, and parameters across 14+ providers (Gemini, Claude, OpenAI, Grok, Perplexity, DeepSeek, Mistral, Cohere, Groq, GitHub Models, NVIDIA, Hugging Face, Together AI, OpenRouter) plus user-added custom providers.

**This app is unique on the platform.** Every other app *consumes* AI configuration; this app *produces* it. The output (`field_llm_config`) is read by every other app via Drupal's `.llm-config-data` div. Touching the output contract is a breaking change for the entire platform — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §4.

## Repository layout

```
src/                  Source files. This is where you edit.
  10-part1/           Core engine: constants, state, init, 3 view renderers, sync/save, exports
  20-part2a/          Modal system, provider config modal (3-step), API key verify, CRUD, undo/redo
  30-part2b/          Live model refresh, LLM config preview, import/export, bulk ops, shortcuts
  styles/
    10-part1/         CSS for app shell, header, sidebar, all 3 views (4 breakpoints)
    20-part2/         CSS for modals, confirm dialogs, configuration steps, parameter controls

dist/                 Build output. Committed so jsDelivr can serve it.
  up.js               Single concatenated JS bundle (loaded by Drupal)
  up.css              Single concatenated CSS bundle (loaded by Drupal)

docs/                 Architecture, API reference, development guide, style reference
scripts/
  build.mjs           Concatenates src/ → dist/
```

## Local development

```powershell
# Edit any file under src/, then rebuild:
node scripts/build.mjs

# Or, if PowerShell execution policy allows npm scripts:
npm run build
```

The build is a simple alphabetical-walk concatenation — no bundler, no plugins, no transforms. File ordering is controlled by numeric prefixes on folder and file names. To reorder, rename.

> **Note on `npm`**: Windows PowerShell may block `npm.ps1` with "running scripts is disabled". Two fixes:
> - Run `npm.cmd run build` (forces the .cmd shim, bypassing .ps1)
> - Or once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## How Drupal loads this

Configured via the Asset Injector module on the Drupal site. Each asset is conditioned on body class `node--type-user-profile`.

Once a CI release pipeline (`.github/workflows/release.yml`) is in place and the first `vX.Y.Z` tag exists, the recommended URL pattern is:

| Mode | URL pattern | Notes |
| --- | --- | --- |
| **Production** | `…@latest/dist/up.{js,css}` | jsDelivr resolves `@latest` to the highest semver tag. |
| **Pinned** (for rollback) | `…@vX.Y.Z/dist/up.{js,css}` | Tag URLs are immutable. Use during incident response. |
| **Bleeding edge** | `…@main/dist/up.{js,css}` | Follows the branch tip. Mutable; jsDelivr caches it ~12 h. |

Full URL once `@latest` is wired up:

```
https://cdn.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.js
https://cdn.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.css
```

Until then, point Asset Injector at `@main` (bleeding edge) and rebuild + push manually for each change. The Operations layer roadmap is in [`CLAUDE.md`](CLAUDE.md) under "Phase A".

## Concatenation order

The walk order matches the original three monolithic files:

1. Everything in `src/10-part1/` (was `up-part1.js`)
2. Everything in `src/20-part2a/` (was `up-part2a.js`)
3. Everything in `src/30-part2b/` (was `up-part2b.js`)

In this initial import, each part folder contains exactly one file — the original monolith, unsplit. Future structural passes may split each into smaller numbered files (`00-header.js`, `01-init.js`, …); the build script doesn't care because it walks lex.

Each Part is wrapped in its own IIFE: `(function($, Drupal) { 'use strict';` at the top and `})(jQuery, Drupal);` at the bottom of the file. Part 2A polls for Part 1's globals before initializing; Part 2B polls for Part 2A. Both have 10s / 15s timeouts that log a `[UP]` console error on failure.

## Drupal setup quick reference

| Item | Value |
| --- | --- |
| Content type | `user_profile` |
| Body class | `node--type-user-profile` |
| Field 1 | `field_json_data` (Textarea, plain text) — working state |
| Field 2 | `field_llm_config` (Textarea, plain text) — clean LLM export |

See [`docs/PROJECT.md`](docs/PROJECT.md) for the full setup, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the init chain and state model, and [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) for the mandatory 7-step save flow.
