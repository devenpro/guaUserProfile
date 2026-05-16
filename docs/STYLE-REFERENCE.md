# Style Reference — User Profile App v1.0

## Design System: GoUltra AI

All apps on the platform share the same visual language. Each app customizes via its own CSS prefix (`up-` for this app). Provider brand colors and activity-type colors are the only hex values allowed outside `:root`.

## CSS Variables (`:root` in `up-part1.css`)

### Colors — Brand

| Variable | Value | Usage |
|----------|-------|-------|
| `--up-primary` | `#1a73e8` | Primary actions, links, active states |
| `--up-primary-hover` | `#1557b0` | Button hover |
| `--up-primary-light` | `#e8f0fe` | Light primary backgrounds, active nav |
| `--up-primary-dark` | `#174ea6` | Dark primary text |
| `--up-primary-subtle` | `#f0f6ff` | Subtle accents |
| `--up-secondary` | `#0d904f` | Secondary accents (green) |
| `--up-secondary-light` | `#e6f4ea` | |
| `--up-accent` | `#e37400` | Accent/warning (orange) |
| `--up-accent-light` | `#fef7e0` | |

### Colors — Semantic

| Variable | Value | Usage |
|----------|-------|-------|
| `--up-success` / `--up-success-light` | `#0d904f` / `#e6f4ea` | Success states, verified badges |
| `--up-warning` / `--up-warning-light` | `#e37400` / `#fef7e0` | Warning states, unverified keys |
| `--up-error` / `--up-error-light` | `#d93025` / `#fce8e6` | Error states, danger buttons |
| `--up-info` / `--up-info-light` | `#1a73e8` / `#e8f0fe` | Info alerts |

### Colors — Gray Scale

`--up-gray-50` (`#f8f9fa`) through `--up-gray-900` (`#202124`). 10 stops.

### Colors — Backgrounds, Text, Borders

| Variable | Value | Usage |
|----------|-------|-------|
| `--up-bg-primary` | `#ffffff` | Card surfaces, header |
| `--up-bg-secondary` | `#f8f9fb` | App body background |
| `--up-bg-tertiary` | `#f1f3f4` | Subtle inset backgrounds |
| `--up-text-primary` | `#202124` | Body copy |
| `--up-text-secondary` | `#5f6368` | Secondary copy |
| `--up-text-tertiary` | `#80868b` | Meta info |
| `--up-text-muted` | `#9aa0a6` | Disabled, placeholders |
| `--up-text-inverse` | `#ffffff` | Text on dark/colored backgrounds |
| `--up-border-light` | `#e8eaed` | Subtle dividers |
| `--up-border-default` | `#dadce0` | Card outlines, inputs |
| `--up-border-dark` | `#bdc1c6` | Hover-state borders |
| `--up-border-focus` | `#1a73e8` | Input focus rings |

### Typography

| Variable | Value |
|----------|-------|
| `--up-font-family` | `'DM Sans', 'Segoe UI', system stack` |
| `--up-font-display` | `'Plus Jakarta Sans', 'Google Sans', system stack` |
| `--up-font-mono` | `'JetBrains Mono', 'Fira Code', 'Consolas'` |
| `--up-font-size-xs` | `11px` |
| `--up-font-size-sm` | `13px` |
| `--up-font-size-base` | `14px` |
| `--up-font-size-md` | `15px` |
| `--up-font-size-lg` | `16px` |
| `--up-font-size-xl` | `18px` |
| `--up-font-size-2xl` | `20px` |
| `--up-font-size-3xl` | `24px` |

### Spacing

`--up-space-1` (4px), `--up-space-2` (8px), `--up-space-3` (12px), `--up-space-4` (16px), `--up-space-5` (20px), `--up-space-6` (24px), `--up-space-8` (32px), `--up-space-10` (40px).

### Radius

| Variable | Value |
|----------|-------|
| `--up-radius-sm` | `6px` |
| `--up-radius-md` | `10px` |
| `--up-radius-lg` | `16px` |
| `--up-radius-xl` | `24px` |
| `--up-radius-full` | `9999px` (pill) |

### Shadows

| Variable | Use |
|----------|-----|
| `--up-shadow-xs` | Hairline lift |
| `--up-shadow-sm` | Cards at rest |
| `--up-shadow-md` | Card hover |
| `--up-shadow-lg` | Floating elements |
| `--up-shadow-xl` | Modals |
| `--up-shadow-glow` | Focus rings on inputs |

### Layout & Motion

| Variable | Value |
|----------|-------|
| `--up-sidebar-width` | `220px` |
| `--up-header-height` | `56px` |
| `--up-drupal-toolbar` | Set at runtime by `renderApp()` based on Drupal toolbar height |
| `--up-transition-fast` | `0.15s cubic-bezier(0.4,0,0.2,1)` |
| `--up-transition-base` | `0.25s cubic-bezier(0.4,0,0.2,1)` |

## Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| `1200px` | Grid adjustments, smaller gaps |
| `992px` | Sidebar becomes drawer (off-canvas), header hamburger appears |
| `768px` | Stack layouts, smaller fonts |
| `480px` | Full-width cards, reduced padding |

## Provider Colors (`MODEL_CATALOG`)

These hex values live in `up-part1.js` constants, not in CSS:

| Provider | Color |
|----------|-------|
| Gemini | `#4285F4` |
| Claude | `#D97706` |
| OpenAI | `#10A37F` |
| Grok | `#1DA1F2` |
| Perplexity | `#20B2AA` |
| DeepSeek | `#5B6CF0` |
| Mistral | `#FF7000` |
| Cohere | `#39594D` |
| Groq | `#F55036` |
| GitHub Models | `#24292F` |
| NVIDIA | `#76B900` |
| Hugging Face | `#FFD21E` |
| Together AI | `#6366F1` |
| OpenRouter | `#8B5CF6` |

**Custom providers** get a deterministic HSL color from `generateCustomColor(id)` (hash → hue, fixed S/L).

## Activity Type Colors (`ACTIVITY_TYPES`)

| Type | Color | Icon |
|------|-------|------|
| `provider-configured` | `#1a73e8` | key |
| `key-verified` | `#0d904f` | shield-check |
| `key-failed` | `#d93025` | triangle-exclamation |
| `model-toggled` | `#3b82f6` | layer-group |
| `default-changed` | `#e37400` | star |
| `provider-removed` | `#ef4444` | trash |
| `llm-config-synced` | `#8b5cf6` | refresh |
| `settings-changed` | `#6b7280` | gear |

## Component Patterns

### Buttons

- `.up-btn` base + `.up-btn-primary` / `.up-btn-outline` / `.up-btn-danger` / `.up-btn-danger-filled` / `.up-btn-success`
- Sizes: `.up-btn-sm` / `.up-btn-xs`
- Icon-only button: `.up-btn-icon`
- Link style: `.up-btn-link`
- Loading state: `.up-btn-loading` with `.up-spinner` child
- All buttons are pill-shaped with hover lift (`translateY(-1px)`)

### Toggle Switch

```html
<span class="up-toggle up-toggle--on" data-action="..." data-provider="...">
  <span class="up-toggle-knob"></span>
</span>
```

### Status Badges

- `.up-status-on` — green pill with circle-dot icon
- `.up-status-off` — gray pill with pause icon
- `.up-cat-pill` — colored category pill (`fast` / `balanced` / `powerful`)

### Cards

- `.up-prov-card` — provider card in Providers view (full-width row)
  - `.up-prov-card--active` — blue left border (verified + enabled + has models)
  - `.up-prov-card--disabled` — gray left border, dimmed (verified + disabled)
  - `.up-prov-card--warning` — orange left border (key entered but not verified)
- `.up-dash-card` — dashboard provider card (grid tile, hover lift)

### Inputs

- `.up-input` — 1.5px border, blue glow ring on focus (`--up-shadow-glow`)
- `.up-select` / `.up-select-sm` — styled native select
- `.up-range` — custom range slider track + thumb

### Modals (in `up-part2.css`)

- `.up-modal-backdrop` — full-screen blur overlay, z-index 1000
- `.up-modal` — centered card. Sizes via modifier classes: `.up-modal-sm` (420px), `.up-modal-md` (560px), `.up-modal-lg` (640px)
- `.up-modal-header` with `.up-modal-header-icon` slot + `.up-modal-subtitle`
- `.up-modal-footer` with `.up-modal-footer-left` + `.up-modal-footer-right` zones

### Confirm Dialog (in `up-part2.css`)

- `.up-confirm-backdrop` — z-index 1100 (above modals so confirms layer correctly)
- `.up-confirm-dialog` — centered card, max-width 400px

### Configuration Steps (in `up-part2.css`)

- `.up-config-step` — numbered step container
- `.up-config-step--locked` — grayed out (opacity 0.35), `pointer-events: none`
- `.up-step-num` / `.up-step-num--active` / `.up-step-num--done` — step number circle states

### Toasts

- `.up-toast-container` — fixed bottom-right
- `.up-toast` + `.up-toast-success` / `--error` / `--warning` / `--info`
- `.up-toast-show` — slide-in animation trigger class

## Layering / z-index Map

| Component | z-index |
|-----------|---------|
| App shell (`.up-app`) | 100 |
| Modal backdrop | 1000 |
| Confirm dialog backdrop | 1100 |
| Toasts | (above modals, set inside `.up-toast-container` rule) |

Drupal toolbar height is read at init and exposed as `--up-drupal-toolbar`, applied to `.up-app top`. This keeps the app shell below the toolbar without hardcoding pixel values.
