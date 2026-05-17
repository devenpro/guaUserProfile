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
  up.js               Concatenated JS bundle, unminified (dev/debug)
  up.css              Concatenated CSS bundle, unminified (dev/debug)
  up.min.js           Minified JS bundle (loaded by Drupal in prod)
  up.min.js.map       Source map for up.min.js (auto-loaded by DevTools)
  up.min.css          Minified CSS bundle (loaded by Drupal in prod)

components/           AI-friendliness schemas. One .component.json per view,
                      AI action, and data export. Drives docs/COMPONENT-INDEX.md.

docs/                 Architecture, API reference, development guide, style reference
  COMPONENT-INDEX.md  AUTO-GENERATED from components/. Do not edit by hand.

scripts/
  build.mjs           Concatenates src/ → dist/
  build-component-index.mjs   Walks components/ → docs/COMPONENT-INDEX.md
```

## Local development

```powershell
# One-time after cloning — install the pre-commit hook (rebuilds dist/
# and parse-checks the bundle before each commit).
bash scripts/install-hooks.sh

# Edit any file under src/, then rebuild:
node scripts/build.mjs

# Or, if PowerShell execution policy allows npm scripts:
npm run build
```

The build does two passes:

1. **Concat** — `scripts/build.mjs` walks `src/` in alphabetical order and concatenates files into `dist/up.js` and `dist/up.css`. File ordering is controlled by numeric prefixes on folder and file names. To reorder, rename.
2. **Minify** — the same script then invokes `npx --yes esbuild` to produce `dist/up.min.js` (with a `up.min.js.map` source map) and `dist/up.min.css`. Minification is best-effort locally: if esbuild can't be fetched (offline, no npm), the script warns and exits 0 with only the unminified bundles. CI (`release.yml`) always has network, so the released `dist/` always contains both pairs. To skip minification entirely (e.g., on a quick local edit), set `UP_SKIP_MINIFY=1`.

Sample `field_json_data` / `field_llm_config` blobs live under [`docs/samples/`](docs/samples/) — useful when seeding a fresh Drupal node or when documenting the producer/consumer contract for sibling apps.

> **Note on `npm`**: Windows PowerShell may block `npm.ps1` with "running scripts is disabled". Two fixes:
> - Run `npm.cmd run build` (forces the .cmd shim, bypassing .ps1)
> - Or once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## How Drupal loads this

Configured via the Asset Injector module on the Drupal site. The Drupal admin points two External rules at jsDelivr URLs, both conditioned on body class `node--type-user-profile`. Pick one of three stability levels:

| Mode | URL pattern | Notes |
| --- | --- | --- |
| **Production** (recommended) | `…@latest/dist/up.min.{js,css}` | jsDelivr resolves `@latest` to the highest semver tag. CI auto-tags every push to `main`, so the live page picks up new releases automatically. Minified bundle keeps payload small; DevTools auto-loads `up.min.js.map` for readable stack traces. |
| **Pinned** (for rollback) | `…@vX.Y.Z/dist/up.min.{js,css}` | Tag URLs are immutable. Use during incident response when you need to freeze the live page on a known-good release. |
| **Bleeding edge** | `…@main/dist/up.min.{js,css}` | Follows the branch tip. Mutable; jsDelivr caches it ~12 h. Use only for short-lived hotfixes before a release exists. |

Full URL for production:

```
https://cdn.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.min.js
https://cdn.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.min.css
```

> **Unminified for debugging.** Swap `up.min.js`/`up.min.css` for `up.js`/`up.css` in the Asset Injector URL to load the human-readable bundles. Useful during incident debugging if the source map alone isn't enough.

### Deploy flow

1. Edit a file under `src/`.
2. `node scripts/build.mjs` to rebuild `dist/up.js` and `dist/up.css` locally (so reviewers can see the diff).
3. Open a PR, merge to `main`.
4. The `Release` GitHub Action (`.github/workflows/release.yml`) bumps `package.json` patch, rebuilds, commits as `[release] vX.Y.Z`, tags, publishes a GitHub Release, and purges the jsDelivr `@latest`/`@main` cache. Tag-to-release wall time is ~13s.
5. Asset Injector at `@latest` picks up the new release within a minute (after Drupal/browser caches expire — see Troubleshooting below).

The running bundle prints its version to the browser console on load:

```
[UP] User Profile v0.1.0 · built 2026-05-16T11:04:27.423Z
```

### Rollback in 30 seconds

1. Open Asset Injector. Change the JS and CSS External URLs from `@latest` to the previous good tag, e.g. `@v0.1.6`.
2. Save. Clear all Drupal caches (Configuration → Performance → Clear all caches).
3. Hard-refresh the page. The console banner should now read the pinned tag.

Available tags: <https://github.com/devenpro/guaUserProfile/tags>.

When the fix lands and a new tag is cut, switch Asset Injector back to `@latest`.

## Troubleshooting

### "The page is blank after a deploy"

Use the console banner to pinpoint which layer is wrong. Open DevTools (F12) → Console.

1. **No `[UP] User Profile v…` line at all.** The bundle didn't execute. Open the Network tab, find the `up.js` request, click into Response. Common causes: 404 (Asset Injector URL is wrong), syntax error from a half-built bundle, or a CSP blocking jsDelivr.
2. **Banner shows an older version than expected.** It's a cache. In order:
   - Browser: hard-refresh (Ctrl+Shift+R / Cmd+Shift+R).
   - jsDelivr (if you must — `@latest` resolves instantly to new tags, but you can purge anyway):
     `https://purge.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.min.js`
     `https://purge.jsdelivr.net/gh/devenpro/guaUserProfile@latest/dist/up.min.css`
   - Drupal: Configuration → Performance → Clear all caches.
3. **Banner shows the right version, but the UI is blank.** It's a runtime bug, not a delivery problem. Look for `[UP] Could not find Drupal form fields` or other `[UP]` errors in the console. Until the source is fixed, pin Asset Injector to the previous `@vX.Y.Z` tag (see "Rollback in 30 seconds" above).

## Concatenation order

The walk order matches the three original monolithic Parts, now split into per-section files:

1. Everything in `src/10-part1/` (16 files: `00-header.js` → `15-exports.js`)
2. Everything in `src/20-part2a/` (9 files: `01-init.js` → `09-exports.js`)
3. Everything in `src/30-part2b/` (9 files: `01-init.js` → `09-exports.js`)

Files concatenate in numeric order within each folder. Each Part is wrapped in its own IIFE: the first numbered file (`00-header.js` for Part 1, `01-init.js` for Parts 2A/2B) opens the IIFE with `(function($, Drupal) { 'use strict';`, and the final numbered file in each Part (`15-exports.js` for Part 1, `09-exports.js` for Parts 2A/2B) closes it with `})(jQuery, Drupal);`. Part 2A polls for Part 1's globals before initializing; Part 2B polls for Part 2A. Both have 10s / 15s timeouts that log a `[UP]` console error on failure.

This means individual source files are **not** standalone-valid JS (they have unbalanced braces by design). Only the concatenated `dist/up.js` is valid. Linters run against individual source files will complain — that's expected; lint the build output if needed. To reorder, rename a file's numeric prefix.

## Drupal setup quick reference

| Item | Value |
| --- | --- |
| Content type | `user_profile` |
| Body class | `node--type-user-profile` |
| Field 1 | `field_json_data` (Textarea, plain text) — working state |
| Field 2 | `field_llm_config` (Textarea, plain text) — clean LLM export |

See [`docs/PROJECT.md`](docs/PROJECT.md) for the full setup, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the init chain and state model, and [`docs/DEVELOPMENT-GUIDE.md`](docs/DEVELOPMENT-GUIDE.md) for the mandatory 7-step save flow.

## License

[MIT](LICENSE).
