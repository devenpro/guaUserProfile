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
  // SECTION 1: CONSTANTS
  // ============================================================

  var APP_VIEWS = {
    'dashboard':  { order: 1, label: 'Dashboard',  icon: 'chart-line',  description: 'Provider overview & activity' },
    'providers':  { order: 2, label: 'Providers',   icon: 'bolt',        description: 'Configure API keys' },
    'models':     { order: 3, label: 'Models',      icon: 'layer-group', description: 'Model management' }
  };

  var MODEL_CATALOG = {
    'gemini': {
      label: 'Gemini', icon: 'sparkles', category: 'major',
      desc: "Google's multimodal AI family", color: '#4285F4',
      test_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      test_method: 'gemini',
      models: [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'claude': {
      label: 'Claude', icon: 'robot', category: 'major',
      desc: "Anthropic's reasoning-first AI", color: '#D97706',
      test_endpoint: 'https://api.anthropic.com/v1/messages',
      test_method: 'claude',
      models: [
        { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', category: 'fast', default_temp: 0.8, max_tokens: 8192 }
      ]
    },
    'openai': {
      label: 'OpenAI', icon: 'cpu', category: 'major',
      desc: 'GPT & o-series models', color: '#10A37F',
      test_endpoint: 'https://api.openai.com/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'gpt-4.1', label: 'GPT-4.1', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'o3-mini', label: 'o3-mini', category: 'powerful', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'grok': {
      label: 'Grok', icon: 'bolt', category: 'major',
      desc: "xAI's conversational AI", color: '#1DA1F2',
      test_endpoint: 'https://api.x.ai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'grok-3', label: 'Grok 3', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'grok-3-mini', label: 'Grok 3 Mini', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'perplexity': {
      label: 'Perplexity', icon: 'search', category: 'major',
      desc: 'Search-augmented AI answers', color: '#20B2AA',
      test_endpoint: 'https://api.perplexity.ai/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'sonar-pro', label: 'Sonar Pro', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'sonar', label: 'Sonar', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'sonar-deep-research', label: 'Sonar Deep Research', category: 'powerful', default_temp: 0.5, max_tokens: 8192 }
      ]
    },
    'deepseek': {
      label: 'DeepSeek', icon: 'search', category: 'major',
      desc: 'Open-source reasoning models', color: '#5B6CF0',
      test_endpoint: 'https://api.deepseek.com/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'deepseek-r1', label: 'DeepSeek R1', category: 'powerful', default_temp: 0.6, max_tokens: 8192 },
        { id: 'deepseek-v3', label: 'DeepSeek V3', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek-r1-0528', label: 'DeepSeek R1 0528', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'groq': {
      label: 'Groq', icon: 'bolt', category: 'infra',
      desc: 'Ultra-fast LPU inference', color: '#F55036',
      test_endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', category: 'fast', default_temp: 0.8, max_tokens: 8192 },
        { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'mistral': {
      label: 'Mistral', icon: 'sparkles', category: 'major',
      desc: 'European open-weight AI', color: '#FF7000',
      test_endpoint: 'https://api.mistral.ai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'mistral-large-latest', label: 'Mistral Large', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'mistral-small-latest', label: 'Mistral Small', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'codestral-latest', label: 'Codestral', category: 'balanced', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'github': {
      label: 'GitHub Models', icon: 'globe', category: 'infra',
      desc: 'GitHub-hosted model marketplace', color: '#24292F',
      test_endpoint: 'https://models.inference.ai.azure.com/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'gpt-4o', label: 'GPT-4o (GitHub)', category: 'balanced', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Phi-4', label: 'Phi-4', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Meta-Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B (GitHub)', category: 'powerful', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'cohere': {
      label: 'Cohere', icon: 'globe', category: 'major',
      desc: 'Enterprise NLP & RAG models', color: '#39594D',
      test_endpoint: 'https://api.cohere.com/v2/chat',
      test_method: 'cohere',
      models: [
        { id: 'command-r-plus', label: 'Command R+', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'command-r', label: 'Command R', category: 'balanced', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'nvidia': {
      label: 'NVIDIA', icon: 'chip', category: 'infra',
      desc: 'NVIDIA NIM endpoints', color: '#76B900',
      test_endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', category: 'balanced', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'huggingface': {
      label: 'Hugging Face', icon: 'boxes-stacked', category: 'infra',
      desc: 'Open model hub router', color: '#FFD21E',
      test_endpoint: 'https://router.huggingface.co/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'mistralai/Mistral-Small-24B-Instruct-2501', label: 'Mistral Small', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'together': {
      label: 'Together AI', icon: 'users', category: 'infra',
      desc: 'Open-source model cloud', color: '#6366F1',
      test_endpoint: 'https://api.together.xyz/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'openrouter': {
      label: 'OpenRouter', icon: 'shuffle', category: 'infra',
      desc: 'Multi-provider router', color: '#8B5CF6',
      test_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (OR)', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (OR)', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (OR)', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    }
  };

  // Ordered list of provider IDs for consistent iteration
  var PROVIDER_ORDER = [
    'gemini', 'claude', 'openai', 'grok', 'perplexity', 'deepseek',
    'groq', 'mistral', 'github', 'cohere', 'nvidia', 'huggingface', 'together', 'openrouter'
  ];

  var ACTIVITY_TYPES = {
    'provider-configured': { icon: 'key', color: '#1a73e8' },
    'key-verified':        { icon: 'shield-check', color: '#0d904f' },
    'key-failed':          { icon: 'triangle-exclamation', color: '#d93025' },
    'model-toggled':       { icon: 'layer-group', color: '#3b82f6' },
    'default-changed':     { icon: 'star', color: '#e37400' },
    'provider-removed':    { icon: 'trash', color: '#ef4444' },
    'llm-config-synced':   { icon: 'refresh', color: '#8b5cf6' },
    'settings-changed':    { icon: 'gear', color: '#6b7280' }
  };

  var CATEGORY_LABELS = {
    'fast':     { label: 'Fast',     color: '#0d904f' },
    'balanced': { label: 'Balanced', color: '#1a73e8' },
    'powerful': { label: 'Powerful', color: '#8b5cf6' }
  };

  // ============================================================
  // SECTION 2: STATE OBJECT
  // ============================================================

  var S = {
    data: {
      providers: [],
      default_provider: '',
      default_model: '',
      preferences: { auto_sync_llm_config: true, timezone: 'UTC' },
      activity: []
    },
    user: { id: '', name: '', email: '', fullName: '', timezone: '', roles: '' },
    // Lookup maps (rebuilt by buildMaps)
    providerMap: {},
    activeProviders: [],       // Providers that are: key_verified + enabled + have active models
    configuredCount: 0,        // Providers with an API key entered
    verifiedCount: 0,          // Providers with key_verified = true
    enabledCount: 0,           // Providers with enabled = true (user toggle)
    exportableCount: 0,        // Providers eligible for LLM config export (verified + enabled + active models)
    totalActiveModels: 0,      // Sum of active models across exportable providers
    // UI state
    currentView: 'dashboard',
    previousView: null,
    providerFilter: 'all',
    modelSearch: '',
    activityExpanded: false,
    // Drupal refs
    $textarea: null,
    $llmConfigTextarea: null,
    $form: null,
    $submitBtn: null,
    _initializing: false,
    initialized: false,
    dirty: false,
    autoSaveTimer: null
  };

  // ============================================================
  // SECTION 3: INITIALIZATION
  // ============================================================

  function isUPPage() {
    return $('body').hasClass('node--type-user-profile');
  }

  Drupal.behaviors = Drupal.behaviors || {};
  Drupal.behaviors.upPart1 = {
    attach: function(context) {
      if (S.initialized || S._initializing) return;
      if (!isUPPage()) return;
      if (!$(context).find('#edit-field-json-data-0-value').length && context !== document) return;
      init();
    }
  };

  // window.load fallback — fires after Drupal.behaviors should have attached.
  // On some Drupal configurations the behavior attach is delayed or skipped
  // (asset aggregation edge cases, lazy-loaded jQuery, etc.); this catches
  // those cases by re-trying init() once the document is fully loaded.
  $(window).on('load.up-fallback', function() {
    if (!S.initialized && !S._initializing && isUPPage()) {
      console.log('[UP] window.load fallback firing init()');
      init();
    }
  });

  function init() {
    if (S._initializing || S.initialized) return;
    S._initializing = true;
    console.log('[UP] Initializing Part 1...');

    parseUserData();
    if (!detectDrupalForm()) {
      console.error('[UP] Could not find Drupal form fields');
      S._initializing = false;
      return;
    }
    loadData();
    migrateData();
    buildMaps();
    _safeBlock('part1-render-app', renderApp);
    _safeBlock('part1-events', setupEventHandlers);
    _safeBlock('part1-auto-save', startAutoSave);

    S.initialized = true;
    S._initializing = false;
    console.log('[UP] Part 1 initialized — ' + S.exportableCount + ' active providers, ' + S.totalActiveModels + ' models, user: ' + (S.user.name || 'unknown'));
  }

  function parseUserData() {
    var $ud = $('#guau-userdata');
    if (!$ud.length) { console.warn('[UP] User data div #guau-userdata not found'); return; }
    S.user = {
      id: ($ud.find('#guau-userid').text() || '').trim(),
      name: ($ud.find('#guau-username').text() || '').trim(),
      email: ($ud.find('#guau-useremail').text() || '').trim(),
      fullName: ($ud.find('#guau-userfullname').text() || '').trim(),
      timezone: ($ud.find('#guau-usertimezone').text() || '').trim(),
      roles: ($ud.find('#guau-userroles').text() || '').trim()
    };
    console.log('[UP] User: ' + S.user.fullName + ' (' + S.user.name + ', id=' + S.user.id + ')');
  }

  function detectDrupalForm() {
    var $ta = $('#edit-field-json-data-0-value');
    var $llmTa = $('#edit-field-llm-config-0-value');
    if (!$ta.length || !$llmTa.length) return false;

    S.$textarea = $ta;
    S.$llmConfigTextarea = $llmTa;
    S.$form = $ta.closest('form');
    S.$submitBtn = S.$form.find('#edit-submit, [data-drupal-selector="edit-submit"]').first();

    // Hide Drupal form elements
    S.$textarea.closest('.field--name-field-json-data').hide();
    S.$llmConfigTextarea.closest('.field--name-field-llm-config').hide();
    S.$form.find('.node-form-options, .field--name-title, .form-actions').hide();
    return true;
  }

  function loadData() {
    // Parse data field. Capture _rawDataEmpty BEFORE any parse / migration
    // so downstream code (e.g., a future setup wizard) can tell "was this
    // textarea blank when the page loaded?" without being fooled by
    // migrateData() backfilling defaults into S.data.
    var rawData = S.$textarea.val();
    S._rawDataEmpty = !rawData || !rawData.trim();
    if (!S._rawDataEmpty) {
      try { S.data = JSON.parse(rawData); }
      catch (e) { console.error('[UP] JSON data parse error:', e); S.data = getDefaultData(); }
    } else {
      S.data = getDefaultData();
    }
  }

  function getDefaultData() {
    // Seed providers from MODEL_CATALOG with empty keys
    var providers = [];
    for (var i = 0; i < PROVIDER_ORDER.length; i++) {
      var pid = PROVIDER_ORDER[i];
      var cat = MODEL_CATALOG[pid];
      if (!cat) continue;
      var models = [];
      for (var m = 0; m < cat.models.length; m++) {
        var cm = cat.models[m];
        models.push({
          id: cm.id, label: cm.label, active: false, is_default: m === 0,
          temperature: cm.default_temp, max_tokens: cm.max_tokens, top_p: 0.95,
          category: cm.category, source: 'catalog'
        });
      }
      providers.push({
        id: pid, label: cat.label, active: false, enabled: false, api_key: '',
        key_verified: false, key_verified_at: null, category: cat.category,
        models: models, last_live_refresh: null
      });
    }
    return {
      providers: providers,
      default_provider: '',
      default_model: '',
      preferences: { auto_sync_llm_config: true, timezone: 'UTC' },
      activity: []
    };
  }

  function migrateData() {
    var d = S.data;
    d.providers = d.providers || [];
    d.default_provider = d.default_provider || '';
    d.default_model = d.default_model || '';
    d.preferences = d.preferences || { auto_sync_llm_config: true, timezone: 'UTC' };
    d.preferences.auto_sync_llm_config = d.preferences.auto_sync_llm_config !== false;
    d.activity = d.activity || [];
    if (!Array.isArray(d.activity)) d.activity = [];

    // Backward compat: migrate providers that don't have the 'enabled' field
    // If a provider has active=true + key_verified=true, set enabled=true (preserve old state)
    for (var bi = 0; bi < d.providers.length; bi++) {
      var bp = d.providers[bi];
      if (bp.enabled === undefined) {
        bp.enabled = !!(bp.active && bp.key_verified);
      }
    }

    // Ensure all catalog providers exist in data (forward-compatible — new providers auto-appear)
    var existingIds = {};
    for (var i = 0; i < d.providers.length; i++) { existingIds[d.providers[i].id] = true; }
    for (var j = 0; j < PROVIDER_ORDER.length; j++) {
      var pid = PROVIDER_ORDER[j];
      if (existingIds[pid]) continue;
      var cat = MODEL_CATALOG[pid];
      if (!cat) continue;
      var models = [];
      for (var m = 0; m < cat.models.length; m++) {
        var cm = cat.models[m];
        models.push({
          id: cm.id, label: cm.label, active: false, is_default: m === 0,
          temperature: cm.default_temp, max_tokens: cm.max_tokens, top_p: 0.95,
          category: cm.category, source: 'catalog'
        });
      }
      d.providers.push({
        id: pid, label: cat.label, active: false, enabled: false, api_key: '',
        key_verified: false, key_verified_at: null, category: cat.category,
        models: models, last_live_refresh: null
      });
    }

    // Ensure each provider has all catalog models (forward-compatible — new models auto-appear)
    for (var k = 0; k < d.providers.length; k++) {
      var prov = d.providers[k];
      var catRef = MODEL_CATALOG[prov.id];
      if (!catRef) continue;
      prov.models = prov.models || [];
      var existingModelIds = {};
      for (var mi = 0; mi < prov.models.length; mi++) { existingModelIds[prov.models[mi].id] = true; }
      for (var ci = 0; ci < catRef.models.length; ci++) {
        var cmod = catRef.models[ci];
        if (existingModelIds[cmod.id]) continue;
        prov.models.push({
          id: cmod.id, label: cmod.label, active: false, is_default: false,
          temperature: cmod.default_temp, max_tokens: cmod.max_tokens, top_p: 0.95,
          category: cmod.category, source: 'catalog'
        });
      }
    }

    S.currentView = readHash();
  }

  // ============================================================
  // SECTION 4: MAP BUILDERS
  // ============================================================

  function buildMaps() {
    S.providerMap = {};
    S.activeProviders = [];
    S.configuredCount = 0;
    S.verifiedCount = 0;
    S.enabledCount = 0;
    S.exportableCount = 0;
    S.totalActiveModels = 0;

    var providers = S.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      S.providerMap[p.id] = p;

      // Has an API key entered
      if (p.api_key && p.api_key.length > 0) S.configuredCount++;

      // Key has been verified
      if (p.key_verified) S.verifiedCount++;

      // User has enabled this provider (toggle on)
      if (p.enabled) S.enabledCount++;

      // Exportable: key verified + enabled + has active models
      if (p.key_verified && p.enabled) {
        var activeModels = (p.models || []).filter(function(m) { return m.active; });
        if (activeModels.length > 0) {
          S.activeProviders.push(p);
          S.exportableCount++;
          S.totalActiveModels += activeModels.length;
        }
      }
    }
  }

  // ============================================================
  // SECTION 5: LLM CONFIG BUILDER
  // ============================================================

  function buildLLMConfig() {
    var config = { providers: [], default_provider: S.data.default_provider || '', default_model: S.data.default_model || '' };
    var providers = S.data.providers || [];

    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      if (!p.enabled || !p.key_verified || !p.api_key) continue;

      var activeModels = [];
      var pModels = p.models || [];
      for (var m = 0; m < pModels.length; m++) {
        var mod = pModels[m];
        if (!mod.active) continue;
        activeModels.push({
          id: mod.id,
          label: mod.label,
          active: true,
          is_default: !!mod.is_default,
          temperature: mod.temperature !== undefined ? mod.temperature : 0.7,
          max_tokens: mod.max_tokens || 8192,
          top_p: mod.top_p !== undefined ? mod.top_p : 0.95
        });
      }
      if (activeModels.length === 0) continue;

      config.providers.push({
        id: p.id,
        label: p.label,
        active: true,
        api_key: p.api_key,
        models: activeModels
      });
    }

    return config;
  }

  // ============================================================
  // SECTION 6: NAVIGATION
  // ============================================================

  function readHash() {
    var h = window.location.hash.replace('#', '');
    return APP_VIEWS[h] ? h : 'dashboard';
  }

  function navigate(viewId) {
    if (!APP_VIEWS[viewId]) viewId = 'dashboard';
    S.previousView = S.currentView;
    S.currentView = viewId;
    window.location.hash = viewId;
    renderCurrentView();
  }

  function renderCurrentView() {
    var $c = $('#upContent');
    if (!$c.length) return;

    var R = window._upRenderers;
    var html = '';

    // Error boundary: any throw inside a view renderer is caught here and
    // replaced with a visible crash card. Without this, an exception leaves
    // #upContent blank with no on-screen signal — silent failure mode that
    // is especially dangerous for a producer app whose output is consumed
    // by every other app on the platform.
    try {
      switch (S.currentView) {
        case 'dashboard':  html = renderDashboard(); break;
        case 'providers':  html = R.providers ? R.providers() : renderProviders(); break;
        case 'models':     html = R.models ? R.models() : renderModels(); break;
        default:           html = renderDashboard(); break;
      }
      $c.html(html);

      // Call view-specific event setup if registered
      if (S.currentView === 'providers' && R.setupProvidersEvents) R.setupProvidersEvents();
      if (S.currentView === 'models' && R.setupModelsEvents) R.setupModelsEvents();
    } catch (err) {
      console.error('[UP] renderCurrentView crashed for view "' + S.currentView + '":', err);
      $c.html(renderCrashCard(S.currentView, err));
    }

    // Update nav active state (always runs, even after a crash, so the
    // sidebar reflects the requested view).
    $('.up-nav-item').removeClass('up-nav-item-active');
    $('.up-nav-item[data-view="' + S.currentView + '"]').addClass('up-nav-item-active');

    // Update nav badges (defensively wrapped — counts may be stale if a
    // render path crashed mid-update, but the badges should still refresh
    // safely from S on the next successful render).
    try {
      $('.up-nav-badge-providers').text(S.exportableCount + '/' + PROVIDER_ORDER.length);
      $('.up-nav-badge-models').text(S.totalActiveModels);
    } catch (e) { /* swallow — badges are cosmetic */ }
  }

  function renderCrashCard(viewName, err) {
    var msg = (err && err.message) ? err.message : String(err);
    var stack = (err && err.stack) ? err.stack : '(no stack available)';
    return '<div class="up-crash-card" role="alert">' +
      '<div class="up-crash-card-icon">' + icon('triangle-exclamation') + '</div>' +
      '<h3 class="up-crash-card-title">View "' + esc(viewName) + '" failed to render</h3>' +
      '<p class="up-crash-card-msg">' + esc(msg) + '</p>' +
      '<details class="up-crash-card-stack"><summary>Stack trace</summary><pre>' + esc(stack) + '</pre></details>' +
      '<p class="up-crash-card-action">Try switching views, or refresh the page. Share the stack trace with the dev.</p>' +
    '</div>';
  }

  // ============================================================
  // SECTION 7: UTILITIES
  // ============================================================

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function icon(name, className) {
    var icons = {
      'chart-line': 'fa-chart-line', 'bolt': 'fa-bolt', 'layer-group': 'fa-layer-group',
      'sparkles': 'fa-sparkles', 'robot': 'fa-robot', 'cpu': 'fa-microchip',
      'search': 'fa-magnifying-glass', 'globe': 'fa-globe', 'chip': 'fa-microchip',
      'users': 'fa-users', 'boxes-stacked': 'fa-boxes-stacked', 'shuffle': 'fa-shuffle',
      'key': 'fa-key', 'lock': 'fa-lock', 'unlock': 'fa-unlock',
      'shield-check': 'fa-shield-check', 'shield': 'fa-shield',
      'check': 'fa-check', 'check-circle': 'fa-circle-check',
      'plus': 'fa-plus', 'minus': 'fa-minus', 'edit': 'fa-pen-to-square',
      'trash': 'fa-trash-can', 'copy': 'fa-copy', 'download': 'fa-download', 'upload': 'fa-upload',
      'refresh': 'fa-arrows-rotate', 'star': 'fa-star',
      'arrow-right': 'fa-arrow-right', 'arrow-left': 'fa-arrow-left',
      'triangle-exclamation': 'fa-triangle-exclamation', 'warning': 'fa-triangle-exclamation',
      'circle-info': 'fa-circle-info', 'info': 'fa-circle-info',
      'success': 'fa-circle-check', 'error': 'fa-circle-xmark',
      'circle-dot': 'fa-circle-dot', 'circle': 'fa-circle',
      'gear': 'fa-gear', 'settings': 'fa-gear', 'clock': 'fa-clock',
      'eye': 'fa-eye', 'eye-off': 'fa-eye-slash',
      'chevron-right': 'fa-chevron-right', 'chevron-down': 'fa-chevron-down',
      'user': 'fa-user', 'sliders': 'fa-sliders',
      'play': 'fa-play', 'pause': 'fa-pause',
      'link': 'fa-link', 'code': 'fa-code',
      'film': 'fa-film', 'video': 'fa-video',
      'lightbulb': 'fa-lightbulb', 'tag': 'fa-tag', 'tags': 'fa-tags',
      'filter': 'fa-filter', 'bars': 'fa-bars',
      'panel-left': 'fa-angles-right', 'panel-left-close': 'fa-angles-left'
    };
    var faClass = icons[name] || 'fa-' + name;
    return '<i class="fas ' + faClass + (className ? ' ' + className : '') + '"></i>';
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    var now = Date.now();
    var then = new Date(isoStr).getTime();
    if (isNaN(then)) return isoStr;
    var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hour' + (Math.floor(diff / 3600) !== 1 ? 's' : '') + ' ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' day' + (Math.floor(diff / 86400) !== 1 ? 's' : '') + ' ago';
    return formatDate(isoStr);
  }

  function truncate(str, max) {
    if (!str) return '';
    max = max || 50;
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  function maskKey(key) {
    if (!key || key.length < 6) return '••••••••';
    return '••••••••' + key.slice(-4);
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms || 250);
    };
  }

  function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
  }

  function logActivity(type, description) {
    S.data.activity = S.data.activity || [];
    S.data.activity.push({
      id: generateId('act'),
      type: type,
      description: description,
      timestamp: new Date().toISOString(),
      user_id: S.user.id || '',
      user_name: S.user.fullName || S.user.name || ''
    });
    // Keep last 200 entries
    if (S.data.activity.length > 200) {
      S.data.activity = S.data.activity.slice(-200);
    }
  }

  function getRecentActivity(n) {
    var acts = S.data.activity || [];
    var sorted = acts.slice().reverse();
    return n ? sorted.slice(0, n) : sorted;
  }

  function getProviderColor(providerId) {
    var cat = MODEL_CATALOG[providerId];
    return cat ? cat.color : '#6b7280';
  }

  function categoryPill(cat) {
    var c = CATEGORY_LABELS[cat] || { label: cat || '', color: '#6b7280' };
    return '<span class="up-cat-pill" style="background:' + c.color + '18;color:' + c.color + ';border:1px solid ' + c.color + '30">' + esc(c.label) + '</span>';
  }

  function getFilteredProviders() {
    var providers = S.data.providers || [];
    var f = S.providerFilter;
    if (f === 'configured') return providers.filter(function(p) { return p.api_key && p.api_key.length > 0; });
    if (f === 'unconfigured') return providers.filter(function(p) { return !p.api_key || p.api_key.length === 0; });
    if (f === 'major' || f === 'infra') return providers.filter(function(p) { return p.category === f; });
    return providers;
  }

  // Resilience helper: runs `fn()` in a try/catch and logs failures with a
  // named tag. Used at init() phase boundaries and by Part 2A/2B (via
  // window._upSafeBlock) so a single island's collapse does not disable
  // the rest of the app.
  function _safeBlock(name, fn) {
    try { fn(); }
    catch (e) { console.error('[UP] Handler block "' + name + '" failed:', e); }
  }

  // ============================================================
  // SECTION 8: APP SHELL
  // ============================================================

  function renderApp() {
    // Compute Drupal toolbar offset
    var toolbarHeight = 0;
    if ($('#toolbar-bar').length) toolbarHeight += $('#toolbar-bar').outerHeight() || 0;
    if ($('.toolbar-tray-horizontal.is-active').length) toolbarHeight += $('.toolbar-tray-horizontal.is-active').outerHeight() || 0;

    var initials = '';
    if (S.user.fullName) {
      var parts = S.user.fullName.split(' ');
      initials = parts[0] ? parts[0].charAt(0).toUpperCase() : '';
      if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
    }
    initials = initials || 'UP';

    var html = '<div id="upApp" class="up-app" style="--up-drupal-toolbar:' + toolbarHeight + 'px">';

    // Header
    html += '<div class="up-header">';
    html += '<div class="up-header-left">';
    html += '<button class="up-btn-icon up-sidebar-toggle" data-action="toggle-sidebar">' + icon('bars') + '</button>';
    html += '<div class="up-header-avatar">' + esc(initials) + '</div>';
    html += '<div class="up-header-info">';
    html += '<span class="up-header-name">User Profile</span>';
    html += '<span class="up-header-handle">' + esc(S.user.fullName || 'User') + ' · GoUltra AI</span>';
    html += '</div></div>';
    html += '<div class="up-header-right">';
    html += '<span class="up-save-status up-saved">' + icon('check') + ' Saved</span>';
    html += '<button class="up-btn up-btn-primary up-btn-sm" data-action="save">' + icon('check') + ' Save</button>';
    html += '</div></div>';

    // Body: sidebar + main
    html += '<div class="up-body">';

    // Sidebar
    html += '<div class="up-sidebar">';
    html += '<div class="up-sidebar-overlay" data-action="toggle-sidebar"></div>';
    html += '<nav class="up-nav">';
    for (var vk in APP_VIEWS) {
      if (!APP_VIEWS.hasOwnProperty(vk)) continue;
      var v = APP_VIEWS[vk];
      var isActive = S.currentView === vk;
      html += '<div class="up-nav-item' + (isActive ? ' up-nav-item-active' : '') + '" data-action="navigate" data-view="' + vk + '">';
      html += '<span class="up-nav-icon">' + icon(v.icon) + '</span>';
      html += '<span class="up-nav-label">' + esc(v.label) + '</span>';
      if (vk === 'providers') html += '<span class="up-nav-badge up-nav-badge-providers">' + S.exportableCount + '/' + PROVIDER_ORDER.length + '</span>';
      if (vk === 'models') html += '<span class="up-nav-badge up-nav-badge-models">' + S.totalActiveModels + '</span>';
      html += '</div>';
    }
    html += '<div class="up-nav-spacer"></div>';
    html += '<div class="up-brand-strip up-brand-strip--active">' + icon('shield-check') + ' <span>GoUltra AI Platform</span></div>';
    html += '</nav></div>';

    // Main content
    html += '<div class="up-main"><div class="up-content" id="upContent"></div></div>';

    html += '</div>'; // body
    html += '<div id="upToasts" class="up-toast-container"></div>';
    html += '</div>'; // app

    // Inject into page
    var $inject = S.$textarea.closest('.layout-region-node-main, .node-form, form');
    if (!$inject.length) $inject = S.$form;
    $inject.before(html);
    $('body').addClass('up-active');

    renderCurrentView();
  }

  // ============================================================
  // SECTION 9: DASHBOARD VIEW
  // ============================================================

  function renderDashboard() {
    var html = '<div class="up-view up-view-dashboard">';

    // View header
    html += '<div class="up-view-header"><div class="up-view-header-left">';
    html += '<h2>' + icon('chart-line') + ' Dashboard</h2>';
    html += '<span class="up-view-subtitle">' + S.exportableCount + ' active provider' + (S.exportableCount !== 1 ? 's' : '') + ' · ' + S.totalActiveModels + ' models</span>';
    html += '</div>';
    html += '<div class="up-view-header-right">';
    if (S.configuredCount > 0) {
      html += '<button class="up-btn up-btn-outline up-btn-sm" data-action="test-all-connections">' + icon('bolt') + ' Test All</button>';
    }
    html += '<button class="up-btn up-btn-outline up-btn-sm" data-action="export-config">' + icon('download') + ' Export</button>';
    if (S.configuredCount > 0) {
      html += '<button class="up-btn up-btn-danger up-btn-sm" data-action="reset-all-providers">' + icon('trash') + ' Start Fresh</button>';
    }
    html += '</div></div>';

    // Active providers grid
    var activeProvs = (S.data.providers || []).filter(function(p) {
      return p.key_verified && p.enabled;
    });

    if (activeProvs.length > 0) {
      html += '<div class="up-dash-provider-grid">';
      for (var i = 0; i < activeProvs.length; i++) {
        var p = activeProvs[i];
        var catInfo = MODEL_CATALOG[p.id];
        var pColor = catInfo ? catInfo.color : (p.color || '#6b7280');
        var pIcon = catInfo ? catInfo.icon : 'sparkles';
        var activeModelCount = (p.models || []).filter(function(m) { return m.active; }).length;

        html += '<div class="up-dash-card" data-action="open-provider" data-provider="' + esc(p.id) + '">';
        // Card top row: icon + test button
        html += '<div class="up-dash-card-top">';
        html += '<span class="up-dash-card-icon" style="background:' + pColor + '">' + icon(pIcon) + '</span>';
        html += '<button class="up-btn-icon up-quick-test up-quick-test--ok" data-action="quick-test" data-provider="' + esc(p.id) + '" title="Test connectivity">' + icon('shield-check') + '</button>';
        html += '</div>';
        // Name
        html += '<div class="up-dash-card-name">' + esc(p.label) + '</div>';
        // Model count + key
        html += '<div class="up-dash-card-meta">';
        html += '<span class="up-dash-card-models">' + icon('layer-group') + ' ' + activeModelCount + ' model' + (activeModelCount !== 1 ? 's' : '') + '</span>';
        html += '</div>';
        // Key masked
        html += '<div class="up-dash-card-key">' + icon('lock') + ' ' + esc(maskKey(p.api_key)) + '</div>';
        // Status
        html += '<div class="up-dash-card-status"><span class="up-status-on">' + icon('circle-dot') + ' Active</span></div>';
        html += '</div>';
      }
      html += '</div>';
    } else {
      // Empty state
      html += '<div class="up-empty-state">';
      html += '<div class="up-empty-state-icon">' + icon('bolt') + '</div>';
      html += '<div class="up-empty-state-title">No active providers</div>';
      html += '<div class="up-empty-state-text">Configure and enable a provider to get started.</div>';
      html += '<button class="up-btn up-btn-primary" data-action="navigate" data-view="providers" style="margin-top:var(--up-space-4)">' + icon('plus') + ' Configure Provider</button>';
      html += '</div>';
    }

    // Activity feed
    html += '<div class="up-section">';
    html += '<div class="up-section-header"><h3>' + icon('clock') + ' Recent Activity</h3></div>';
    var recentActs = getRecentActivity(S.activityExpanded ? 20 : 5);
    if (recentActs.length === 0) {
      html += '<div class="up-empty-state-sm">' + icon('clock') + ' No activity yet. Configure a provider to get started.</div>';
    } else {
      html += '<div class="up-activity-feed">';
      for (var a = 0; a < recentActs.length; a++) {
        var act = recentActs[a];
        var atCfg = ACTIVITY_TYPES[act.type] || { icon: 'circle', color: '#6b7280' };
        html += '<div class="up-act-item">';
        html += '<span class="up-act-dot" style="background:' + atCfg.color + '">' + icon(atCfg.icon) + '</span>';
        html += '<div class="up-act-content">';
        html += '<span class="up-act-text">' + esc(act.description) + '</span>';
        html += '<span class="up-act-time">' + formatRelativeTime(act.timestamp) + '</span>';
        html += '</div></div>';
      }
      html += '</div>';
    }
    var totalActs = (S.data.activity || []).length;
    if (totalActs > 5) {
      html += '<button class="up-btn-link up-act-toggle" data-action="toggle-activity">';
      html += S.activityExpanded ? 'Show less' : 'Show all ' + totalActs + ' entries';
      html += ' ' + icon(S.activityExpanded ? 'chevron-right' : 'chevron-down');
      html += '</button>';
    }
    html += '</div>';

    html += '</div>'; // view
    return html;
  }

  // ============================================================
  // SECTION 10: PROVIDERS VIEW
  // ============================================================

  function renderProviders() {
    var filtered = getFilteredProviders();

    var html = '<div class="up-view up-view-providers">';

    // Header
    html += '<div class="up-view-header"><div class="up-view-header-left">';
    html += '<h2>' + icon('bolt') + ' AI Providers</h2>';
    html += '<span class="up-view-subtitle">' + S.verifiedCount + ' verified, ' + S.exportableCount + ' exporting</span>';
    html += '</div>';
    html += '<div class="up-view-header-right">';
    html += '<button class="up-btn up-btn-primary up-btn-sm" data-action="add-custom-provider">' + icon('plus') + ' Add Provider</button>';
    if (S.configuredCount > 0) {
      html += '<button class="up-btn up-btn-outline up-btn-sm" data-action="test-all-connections">' + icon('bolt') + ' Test All</button>';
    }
    html += '<button class="up-btn up-btn-outline up-btn-sm" data-action="import-config">' + icon('upload') + ' Import</button>';
    if (S.configuredCount > 0) {
      html += '<button class="up-btn up-btn-danger up-btn-sm" data-action="reset-all-providers">' + icon('trash') + ' Start Fresh</button>';
    }
    html += '</div></div>';

    // Filter toolbar
    var filters = [
      { id: 'all', label: 'All' },
      { id: 'configured', label: 'Configured' },
      { id: 'unconfigured', label: 'Unconfigured' },
      { id: 'major', label: 'Model Providers' },
      { id: 'infra', label: 'Infrastructure' }
    ];
    html += '<div class="up-list-toolbar">';
    for (var fi = 0; fi < filters.length; fi++) {
      var f = filters[fi];
      html += '<button class="up-filter-pill' + (S.providerFilter === f.id ? ' up-filter-pill--active' : '') + '" data-action="provider-filter" data-filter="' + f.id + '">';
      html += esc(f.label) + '</button>';
    }
    html += '</div>';

    // Provider cards
    html += '<div class="up-providers-list">';
    for (var i = 0; i < filtered.length; i++) {
      var p = filtered[i];
      var catInfo = MODEL_CATALOG[p.id];
      var pColor = catInfo ? catInfo.color : '#6b7280';
      var pIcon = catInfo ? catInfo.icon : 'circle';
      var pDesc = catInfo ? catInfo.desc : '';
      var pCategory = p.category || (catInfo ? catInfo.category : 'major');
      var hasKey = p.api_key && p.api_key.length > 0;
      var isVerified = p.key_verified;
      var isEnabled = p.enabled;
      var isExportable = isVerified && isEnabled;
      var activeModelCount = isExportable ? (p.models || []).filter(function(m) { return m.active; }).length : 0;

      // Card state class
      var cardClass = 'up-prov-card';
      if (isExportable && activeModelCount > 0) cardClass += ' up-prov-card--active';
      else if (isVerified && !isEnabled) cardClass += ' up-prov-card--disabled';
      else if (hasKey && !isVerified) cardClass += ' up-prov-card--warning';

      html += '<div class="' + cardClass + '">';

      // Left side
      html += '<div class="up-prov-left">';
      html += '<div class="up-prov-icon" style="background:' + pColor + '">' + icon(pIcon) + '</div>';
      html += '<div class="up-prov-info">';
      html += '<div class="up-prov-name-row">';
      html += '<span class="up-prov-name">' + esc(p.label) + '</span>';
      html += '<span class="up-prov-cat up-prov-cat--' + esc(pCategory) + '">' + (pCategory === 'major' ? 'Model Provider' : 'Infrastructure') + '</span>';
      html += '</div>';
      html += '<div class="up-prov-desc">' + esc(pDesc) + '</div>';

      // Meta row — varies by state
      if (isVerified) {
        html += '<div class="up-prov-meta">';
        html += '<span class="up-prov-key-info">' + icon('lock') + ' ' + esc(maskKey(p.api_key)) + '</span>';
        html += '<span class="up-prov-verified">' + icon('shield-check') + ' Verified</span>';
        if (isEnabled) {
          html += '<span class="up-prov-model-ct">' + icon('layer-group') + ' ' + activeModelCount + ' model' + (activeModelCount !== 1 ? 's' : '') + '</span>';
        } else {
          html += '<span class="up-prov-disabled-label">' + icon('pause') + ' Disabled</span>';
        }
        html += '</div>';
      } else if (hasKey) {
        html += '<div class="up-prov-meta">';
        html += '<span class="up-prov-key-info">' + icon('key') + ' Key entered</span>';
        html += '<span class="up-prov-unverified">' + icon('triangle-exclamation') + ' Not verified</span>';
        html += '</div>';
      }
      html += '</div></div>'; // prov-left

      // Right side
      html += '<div class="up-prov-right">';

      // Quick test button (only for providers with a key)
      if (hasKey) {
        html += '<button class="up-btn-icon up-quick-test' + (isVerified ? ' up-quick-test--ok' : '') + '" data-action="quick-test" data-provider="' + esc(p.id) + '" title="Test connectivity">' + icon(isVerified ? 'shield-check' : 'bolt') + '</button>';
      }

      // Enable/disable toggle (only for verified providers)
      if (isVerified) {
        html += '<span class="up-toggle' + (isEnabled ? ' up-toggle--on' : '') + '" data-action="toggle-provider-enabled" data-provider="' + esc(p.id) + '" title="' + (isEnabled ? 'Disable provider' : 'Enable provider') + '"><span class="up-toggle-knob"></span></span>';
      }

      // Status badge
      if (isExportable && activeModelCount > 0) {
        html += '<span class="up-status-on">' + icon('circle-dot') + ' Active</span>';
      } else if (isVerified && !isEnabled) {
        html += '<span class="up-status-off">' + icon('pause') + ' Disabled</span>';
      }

      // Action button
      html += '<button class="up-btn ' + (isVerified ? 'up-btn-outline' : 'up-btn-primary') + ' up-btn-sm" data-action="open-provider" data-provider="' + esc(p.id) + '">';
      html += isVerified ? icon('edit') + ' Manage' : icon('key') + ' Configure';
      html += '</button>';
      html += '</div>';

      html += '</div>'; // prov-card
    }
    html += '</div>';

    html += '</div>'; // view
    return html;
  }

  // ============================================================
  // SECTION 11: MODELS VIEW
  // ============================================================

  function renderModels() {
    var html = '<div class="up-view up-view-models">';

    // Header
    html += '<div class="up-view-header"><div class="up-view-header-left">';
    html += '<h2>' + icon('layer-group') + ' Model Management</h2>';
    html += '<span class="up-view-subtitle">' + S.totalActiveModels + ' models enabled</span>';
    html += '</div></div>';

    // Search
    html += '<div class="up-model-search">';
    html += '<span class="up-search-icon">' + icon('search') + '</span>';
    html += '<input type="text" class="up-input up-model-search-input" placeholder="Search models by name or ID..." value="' + esc(S.modelSearch) + '">';
    html += '</div>';

    // All verified providers (including disabled ones) — show models for management
    var verifiedProviders = (S.data.providers || []).filter(function(p) { return p.key_verified; });
    if (verifiedProviders.length === 0) {
      html += '<div class="up-empty-state">';
      html += '<div class="up-empty-state-icon">' + icon('triangle-exclamation') + '</div>';
      html += '<div class="up-empty-state-title">No providers verified</div>';
      html += '<div class="up-empty-state-text">Go to <a href="#" data-action="navigate" data-view="providers">Providers</a> to add and verify API keys.</div>';
      html += '</div>';
    } else {
      for (var pi = 0; pi < verifiedProviders.length; pi++) {
        var p = verifiedProviders[pi];
        var catInfo = MODEL_CATALOG[p.id];
        var pColor = catInfo ? catInfo.color : '#6b7280';
        var pIcon = catInfo ? catInfo.icon : 'circle';
        var allModels = p.models || [];
        var activeCount = allModels.filter(function(m) { return m.active; }).length;
        var isDisabled = !p.enabled;

        // Filter by search
        var displayModels = allModels;
        if (S.modelSearch) {
          var q = S.modelSearch.toLowerCase();
          displayModels = allModels.filter(function(m) {
            return (m.label && m.label.toLowerCase().indexOf(q) > -1) || (m.id && m.id.toLowerCase().indexOf(q) > -1);
          });
        }
        if (displayModels.length === 0) continue;

        html += '<div class="up-model-section' + (isDisabled ? ' up-model-section--disabled' : '') + '">';
        // Section header
        html += '<div class="up-msec-header">';
        html += '<span class="up-msec-icon" style="background:' + (isDisabled ? 'var(--up-gray-400)' : pColor) + '">' + icon(pIcon) + '</span>';
        html += '<span class="up-msec-name">' + esc(p.label) + '</span>';
        if (isDisabled) {
          html += '<span class="up-msec-disabled">' + icon('pause') + ' Disabled — models won\'t export</span>';
        }
        html += '<span class="up-msec-count">' + activeCount + ' / ' + allModels.length + ' enabled</span>';
        html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="enable-all-models" data-provider="' + esc(p.id) + '" title="Enable all models">' + icon('check') + ' All</button>';
        html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="disable-all-models" data-provider="' + esc(p.id) + '" title="Disable all models">' + icon('minus') + ' None</button>';
        html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="live-refresh" data-provider="' + esc(p.id) + '">' + icon('refresh') + ' Refresh</button>';
        html += '</div>';

        // Model table
        html += '<div class="up-mtable">';
        html += '<div class="up-mtable-head">';
        html += '<span class="up-mc up-mc-toggle">On/Off</span>';
        html += '<span class="up-mc up-mc-name">Model</span>';
        html += '<span class="up-mc up-mc-cat">Category</span>';
        html += '<span class="up-mc up-mc-temp">Temp</span>';
        html += '<span class="up-mc up-mc-tok">Tokens</span>';
        html += '<span class="up-mc up-mc-def">Default</span>';
        html += '</div>';

        for (var mi = 0; mi < displayModels.length; mi++) {
          var m = displayModels[mi];
          var isOn = m.active;
          var isDef = m.is_default && isOn;
          html += '<div class="up-mtable-row' + (isOn ? '' : ' up-mtable-row--off') + '" data-provider="' + esc(p.id) + '" data-model="' + esc(m.id) + '">';

          // Toggle
          html += '<span class="up-mc up-mc-toggle">';
          html += '<span class="up-toggle' + (isOn ? ' up-toggle--on' : '') + '" data-action="toggle-model" data-provider="' + esc(p.id) + '" data-model="' + esc(m.id) + '"><span class="up-toggle-knob"></span></span>';
          html += '</span>';

          // Name
          html += '<span class="up-mc up-mc-name"><strong>' + esc(m.label) + '</strong><code>' + esc(m.id) + '</code></span>';

          // Category
          html += '<span class="up-mc up-mc-cat">' + categoryPill(m.category) + '</span>';

          // Temp
          html += '<span class="up-mc up-mc-temp">' + (isOn ? (m.temperature !== undefined ? m.temperature : '0.7') : '—') + '</span>';

          // Tokens
          html += '<span class="up-mc up-mc-tok">' + (isOn ? ((m.max_tokens || 8192) >= 1000 ? Math.round((m.max_tokens || 8192) / 1000) + 'k' : (m.max_tokens || 8192)) : '—') + '</span>';

          // Default star
          html += '<span class="up-mc up-mc-def">';
          if (isOn) {
            html += '<span class="up-star' + (isDef ? ' up-star--on' : '') + '" data-action="set-model-default" data-provider="' + esc(p.id) + '" data-model="' + esc(m.id) + '">' + icon('star') + '</span>';
          }
          html += '</span>';

          html += '</div>'; // row
        }
        html += '</div>'; // table
        html += '</div>'; // section
      }
    }

    // Global default
    html += '<div class="up-section" style="margin-top:var(--up-space-6)">';
    html += '<h3>Profile Default</h3>';
    html += '<p class="up-help-text">Fallback when an app hasn\'t set its own default</p>';
    var defProv = S.data.default_provider ? S.providerMap[S.data.default_provider] : null;
    if (defProv) {
      var defColor = getProviderColor(defProv.id);
      var defCat = MODEL_CATALOG[defProv.id];
      var defModelLabel = S.data.default_model || '';
      var defMods = defProv.models || [];
      for (var di = 0; di < defMods.length; di++) {
        if (defMods[di].id === S.data.default_model) { defModelLabel = defMods[di].label; break; }
      }
      html += '<div class="up-global-default">';
      html += '<span class="up-gd-icon" style="background:' + defColor + '">' + icon(defCat ? defCat.icon : 'sparkles') + '</span>';
      html += '<div class="up-gd-info"><strong>' + esc(defModelLabel || S.data.default_model) + '</strong>';
      html += '<span>' + esc(defProv.label) + ' · temp 0.7 · 8k tokens</span></div>';
      html += '<button class="up-btn up-btn-sm up-btn-outline" data-action="change-default">Change</button>';
      html += '</div>';
    } else {
      html += '<div class="up-empty-state-sm">';
      html += icon('star') + ' No default set. Configure and activate a provider first.';
      html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // view
    return html;
  }

  // ============================================================
  // SECTION 12: EVENT HANDLERS
  // ============================================================

  function setupEventHandlers() {
    // Navigation
    $(document).off('click.up-nav', '[data-action="navigate"]').on('click.up-nav', '[data-action="navigate"]', function(e) {
      e.preventDefault();
      navigate($(this).data('view'));
    });

    // Sidebar toggle
    $(document).off('click.up-sidebar', '[data-action="toggle-sidebar"]').on('click.up-sidebar', '[data-action="toggle-sidebar"]', function(e) {
      e.preventDefault();
      $('#upApp').toggleClass('up-app--sidebar-hidden');
    });

    // Save button
    $(document).off('click.up-save', '[data-action="save"]').on('click.up-save', '[data-action="save"]', function(e) {
      e.preventDefault();
      syncToTextarea();
      updateSaveStatus('saving');
      setTimeout(function() {
        if (S.$submitBtn && S.$submitBtn.length) S.$submitBtn.click();
      }, 100);
    });

    // Provider filter pills
    $(document).off('click.up-pf', '[data-action="provider-filter"]').on('click.up-pf', '[data-action="provider-filter"]', function(e) {
      e.preventDefault();
      S.providerFilter = $(this).data('filter') || 'all';
      renderCurrentView();
    });

    // Toggle provider enabled/disabled (quick switch without opening modal)
    $(document).off('click.up-tpe', '[data-action="toggle-provider-enabled"]').on('click.up-tpe', '[data-action="toggle-provider-enabled"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      prov.enabled = !prov.enabled;
      logActivity(prov.enabled ? 'provider-configured' : 'provider-removed',
        prov.label + ' ' + (prov.enabled ? 'enabled' : 'disabled'));
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast(prov.label + (prov.enabled ? ' enabled' : ' disabled'), 'success');
    });

    // Open provider modal (Part 2A will handle this — for now, navigate to providers)
    $(document).off('click.up-op', '[data-action="open-provider"]').on('click.up-op', '[data-action="open-provider"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider');
      // Part 2A will override this to open a modal
      var R = window._upRenderers;
      if (R.openProviderModal) {
        R.openProviderModal(providerId);
      } else {
        console.log('[UP] Provider clicked: ' + providerId + ' (modal not yet available — Part 2A)');
        navigate('providers');
      }
    });

    // Add custom provider (Part 2A will handle the modal)
    $(document).off('click.up-acp', '[data-action="add-custom-provider"]').on('click.up-acp', '[data-action="add-custom-provider"]', function(e) {
      e.preventDefault();
      var R = window._upRenderers;
      if (R.openAddCustomProviderModal) {
        R.openAddCustomProviderModal();
      } else {
        toast('Custom provider feature loading...', 'info');
      }
    });

    // Model search (debounced)
    $(document).off('input.up-ms', '.up-model-search-input').on('input.up-ms', '.up-model-search-input', debounce(function() {
      var cursorPos = this.selectionStart;
      S.modelSearch = $(this).val() || '';
      renderCurrentView();
      // Restore focus and cursor position after re-render
      var $newInput = $('.up-model-search-input');
      if ($newInput.length) {
        $newInput.focus();
        try { $newInput[0].setSelectionRange(cursorPos, cursorPos); } catch (e) {}
      }
    }, 300));

    // Toggle model on/off
    $(document).off('click.up-tm', '[data-action="toggle-model"]').on('click.up-tm', '[data-action="toggle-model"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var modelId = $(this).data('model');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) {
          models[i].active = !models[i].active;
          logActivity('model-toggled', (models[i].active ? 'Enabled' : 'Disabled') + ': ' + models[i].label + ' (' + prov.label + ')');
          break;
        }
      }
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast((models.find(function(m) { return m.id === modelId; }) || {}).active ? 'Model enabled' : 'Model disabled', 'success');
    });

    // Set model as provider default
    $(document).off('click.up-smd', '[data-action="set-model-default"]').on('click.up-smd', '[data-action="set-model-default"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var modelId = $(this).data('model');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        models[i].is_default = (models[i].id === modelId);
      }
      logActivity('default-changed', 'Default model for ' + prov.label + ' set to ' + modelId);
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast('Default updated', 'success');
    });

    // Activity expand/collapse
    $(document).off('click.up-ta', '[data-action="toggle-activity"]').on('click.up-ta', '[data-action="toggle-activity"]', function(e) {
      e.preventDefault();
      S.activityExpanded = !S.activityExpanded;
      renderCurrentView();
    });

    // Toast close
    $(document).off('click.up-tc', '.up-toast-close').on('click.up-tc', '.up-toast-close', function() {
      $(this).closest('.up-toast').removeClass('up-toast-show');
      var $t = $(this).closest('.up-toast');
      setTimeout(function() { $t.remove(); }, 300);
    });

    // Hash change
    $(window).off('hashchange.up').on('hashchange.up', function() {
      var h = readHash();
      if (h !== S.currentView) navigate(h);
    });
  }

  // ============================================================
  // SECTION 13: SYNC & SAVE
  // ============================================================

  function syncToTextarea() {
    if (!S.$textarea || !S.$textarea.length) return;

    // Write working data
    S.$textarea.val(JSON.stringify(S.data, null, 2)).trigger('change');

    // Write LLM config export
    if (S.$llmConfigTextarea && S.$llmConfigTextarea.length) {
      var llmConfig = buildLLMConfig();
      S.$llmConfigTextarea.val(JSON.stringify(llmConfig, null, 2)).trigger('change');
    }

    S.dirty = true;
    updateSaveStatus('unsaved');
  }

  function updateSaveStatus(status) {
    var $s = $('.up-save-status');
    if (status === 'saving') {
      $s.html(icon('refresh') + ' Saving...').removeClass('up-saved up-unsaved').addClass('up-saving');
    } else if (status === 'saved') {
      $s.html(icon('check') + ' Saved').removeClass('up-saving up-unsaved').addClass('up-saved');
      S.dirty = false;
    } else {
      $s.html(icon('circle') + ' Unsaved').removeClass('up-saving up-saved').addClass('up-unsaved');
    }
  }

  function startAutoSave() {
    if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = setInterval(function() {
      if (S.dirty) { syncToTextarea(); updateSaveStatus('saved'); }
    }, 30000);
  }

  $(window).on('beforeunload', function() {
    if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
  });

  // ============================================================
  // SECTION 14: TOAST NOTIFICATIONS
  // ============================================================

  function toast(msg, type, dur) {
    type = type || 'info';
    dur = dur || 3000;
    var $c = $('#upToasts');
    if (!$c.length) { $c = $('<div id="upToasts" class="up-toast-container"></div>'); $('#upApp').append($c); }

    var id = 'toast_' + Date.now();
    var iconName = type === 'success' ? 'success' : (type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'info'));

    $c.append(
      '<div class="up-toast up-toast-' + type + '" id="' + id + '">' +
      '<span class="up-toast-icon">' + icon(iconName) + '</span>' +
      '<span class="up-toast-message">' + esc(msg) + '</span>' +
      '<button class="up-toast-close">&times;</button>' +
      '</div>'
    );

    setTimeout(function() { $('#' + id).addClass('up-toast-show'); }, 10);
    setTimeout(function() {
      $('#' + id).removeClass('up-toast-show');
      setTimeout(function() { $('#' + id).remove(); }, 300);
    }, dur);
  }

  // ============================================================
  // SECTION 15: API EXPORTS
  // ============================================================

  window._upState = S;
  // Core
  window._upRender = renderCurrentView;
  window._upNavigate = navigate;
  window._upToast = toast;
  window._upGenerateId = generateId;
  window._upBuildMaps = buildMaps;
  window._upSyncToTextarea = syncToTextarea;
  window._upUpdateSaveStatus = updateSaveStatus;
  window._upLogActivity = logActivity;
  // Resilience seam used by Part 2A/2B handler-setup wrappers
  window._upSafeBlock = _safeBlock;
  window._upBuildLLMConfig = buildLLMConfig;
  // Utilities
  window._upEsc = esc;
  window._upIcon = icon;
  window._upDeepClone = deepClone;
  window._upTruncate = truncate;
  window._upMaskKey = maskKey;
  window._upDebounce = debounce;
  window._upIsEmpty = isEmpty;
  // Formatters
  window._upFormatDate = formatDate;
  window._upFormatRelativeTime = formatRelativeTime;
  // Getters
  window._upGetRecentActivity = getRecentActivity;
  window._upGetFilteredProviders = getFilteredProviders;
  window._upGetProviderColor = getProviderColor;
  window._upCategoryPill = categoryPill;
  // Constants
  window._upConstants = {
    APP_VIEWS: APP_VIEWS,
    MODEL_CATALOG: MODEL_CATALOG,
    PROVIDER_ORDER: PROVIDER_ORDER,
    ACTIVITY_TYPES: ACTIVITY_TYPES,
    CATEGORY_LABELS: CATEGORY_LABELS
  };

  console.log('[UP] Part 1 loaded');
})(jQuery, Drupal);
