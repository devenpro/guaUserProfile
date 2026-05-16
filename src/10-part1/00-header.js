/**
 * User Profile App v1.0 - Part 1: Core Engine
 *
 * AI provider configuration app for the GoUltra AI platform.
 * Manages API keys, model selections, and generates LLM config
 * consumed by all other platform apps via .llm-config-data div.
 *
 * 2-Field Architecture:
 *   field_json_data  → S.data (working state: providers, keys, models, activity, prefs)
 *   field_llm_config → auto-generated clean export for consuming apps
 *
 * Sections:
 *  1. Constants (APP_VIEWS, MODEL_CATALOG, PROVIDER_ICONS, ACTIVITY_TYPES, CATEGORY_LABELS)
 *  2. State Object
 *  3. Initialization
 *  4. Map Builders
 *  5. LLM Config Builder
 *  6. Navigation
 *  7. Utilities
 *  8. App Shell
 *  9. Dashboard View
 * 10. Providers View
 * 11. Models View
 * 12. Event Handlers
 * 13. Sync & Save
 * 14. Toast Notifications
 * 15. API Exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

  // Version banner — first line in the console on every page load.
  // Reads window.UP_VERSION / window.UP_BUILD_TIME set by the build prologue
  // in dist/up.js. Falls back to 'dev' when running unbundled source.
  console.log('[UP] User Profile v' + (window.UP_VERSION || 'dev') + (window.UP_BUILD_TIME ? ' · built ' + window.UP_BUILD_TIME : ''));

  window._upRenderers = window._upRenderers || {};

  // ============================================================
