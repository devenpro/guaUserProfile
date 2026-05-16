/* User Profile v0.1.0 · built 2026-05-16T11:17:53.799Z · 3 source files (see src/) */
window.UP_VERSION = "0.1.0";
window.UP_BUILD_TIME = "2026-05-16T11:17:53.799Z";

/* ===== src/10-part1/up-part1.js ===== */
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
    renderApp();
    setupEventHandlers();
    startAutoSave();

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
    // Parse data field
    var rawData = S.$textarea.val();
    if (rawData && rawData.trim()) {
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

    // Update nav active state
    $('.up-nav-item').removeClass('up-nav-item-active');
    $('.up-nav-item[data-view="' + S.currentView + '"]').addClass('up-nav-item-active');

    // Update nav badges
    $('.up-nav-badge-providers').text(S.exportableCount + '/' + PROVIDER_ORDER.length);
    $('.up-nav-badge-models').text(S.totalActiveModels);
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

/* ===== src/20-part2a/up-part2a.js ===== */
/**
 * User Profile App v1.0 - Part 2A: Provider Configuration Engine
 *
 * Modal system, provider configuration (key → verify → models → params),
 * API key verification, provider CRUD, undo/redo, default management.
 *
 * Sections:
 *  1. Init & Imports
 *  2. Modal System
 *  3. Undo/Redo
 *  4. Provider Configuration Modal (3-step flow)
 *  5. API Key Verification
 *  6. Provider Save & Remove
 *  7. Change Default Modal
 *  8. Events
 *  9. API Exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

  // ============================================================
  // SECTION 1: INIT & IMPORTS
  // ============================================================

  var S, render, navigate, toast, generateId, buildMaps, syncToTextarea;
  var updateSaveStatus, esc, deepClone, icon, logActivity;
  var formatDate, formatRelativeTime, truncate, maskKey;
  var getRecentActivity, getFilteredProviders, getProviderColor, categoryPill;
  var buildLLMConfig, Constants;

  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    if (window._upState && window._upState.initialized) {
      clearInterval(checkInterval);
      initPart2A();
    } else if (_checkCount > 100) {
      clearInterval(checkInterval);
      console.error('[UP] Part 2A: Timed out waiting for Part 1');
    }
  }, 100);

  function initPart2A() {
    console.log('[UP] Initializing Part 2A...');

    S = window._upState;
    render = window._upRender;
    navigate = window._upNavigate;
    toast = window._upToast;
    generateId = window._upGenerateId;
    buildMaps = window._upBuildMaps;
    syncToTextarea = window._upSyncToTextarea;
    updateSaveStatus = window._upUpdateSaveStatus;
    esc = window._upEsc;
    deepClone = window._upDeepClone;
    icon = window._upIcon;
    logActivity = window._upLogActivity;
    formatDate = window._upFormatDate;
    formatRelativeTime = window._upFormatRelativeTime;
    truncate = window._upTruncate;
    maskKey = window._upMaskKey;
    getRecentActivity = window._upGetRecentActivity;
    getFilteredProviders = window._upGetFilteredProviders;
    getProviderColor = window._upGetProviderColor;
    categoryPill = window._upCategoryPill;
    buildLLMConfig = window._upBuildLLMConfig;
    Constants = window._upConstants;

    // Register renderers
    var R = window._upRenderers = window._upRenderers || {};
    R.openProviderModal = openProviderModal;
    R.openAddCustomProviderModal = openAddCustomProviderModal;

    setupPart2AEvents();
    snapshot('Initial state');

    if (render) render();
    console.log('[UP] Part 2A initialized');
  }

  // ============================================================
  // SECTION 2: MODAL SYSTEM
  // ============================================================

  var currentModal = null;

  function openModal(title, content, options) {
    options = options || {};
    closeModal();
    var size = options.size || 'md';

    var html = '<div class="up-modal-backdrop">';
    html += '<div class="up-modal up-modal-' + size + '">';

    // Header
    html += '<div class="up-modal-header">';
    if (options.headerIcon) {
      html += '<span class="up-modal-header-icon" style="background:' + (options.headerIconColor || 'var(--up-primary)') + '">' + icon(options.headerIcon) + '</span>';
    }
    html += '<div class="up-modal-header-text"><h3>' + title + '</h3>';
    if (options.subtitle) html += '<span class="up-modal-subtitle">' + esc(options.subtitle) + '</span>';
    html += '</div>';
    html += '<button class="up-btn-icon up-modal-close" data-action="close-modal">' + icon('x') + '</button>';
    html += '</div>';

    // Body
    html += '<div class="up-modal-body">' + content + '</div>';

    // Footer
    if (options.footer !== false) {
      html += '<div class="up-modal-footer">';
      if (options.footerLeft) html += '<div class="up-modal-footer-left">' + options.footerLeft + '</div>';
      html += '<div class="up-modal-footer-right">';
      html += '<button class="up-btn up-btn-outline" data-action="close-modal">Cancel</button>';
      if (options.saveLabel !== false) {
        html += '<button class="up-btn up-btn-primary" data-action="modal-save">' + icon('check') + ' ' + (options.saveLabel || 'Save') + '</button>';
      }
      html += '</div></div>';
    }

    html += '</div></div>';
    $('body').append(html);
    currentModal = options;
    setTimeout(function() { $('.up-modal-backdrop').addClass('up-modal-visible'); }, 10);
  }

  function closeModal() {
    $('.up-modal-backdrop').remove();
    currentModal = null;
    _verifyingProvider = null;
  }

  function openConfirmDialog(opts) {
    var html = '<div class="up-confirm-backdrop"><div class="up-confirm-dialog">';
    html += '<h3>' + esc(opts.title || 'Confirm') + '</h3>';
    html += '<p>' + esc(opts.message || 'Are you sure?') + '</p>';
    html += '<div class="up-confirm-actions">';
    html += '<button class="up-btn up-btn-outline" data-action="confirm-cancel">Cancel</button>';
    html += '<button class="up-btn ' + (opts.danger ? 'up-btn-danger-filled' : 'up-btn-primary') + '" data-action="confirm-ok">' + esc(opts.confirmLabel || 'Confirm') + '</button>';
    html += '</div></div></div>';
    $('body').append(html);
    $(document).off('click.up2a-cok').on('click.up2a-cok', '[data-action="confirm-ok"]', function() {
      closeConfirmDialog();
      if (opts.onConfirm) opts.onConfirm();
    });
    $(document).off('click.up2a-ccn').on('click.up2a-ccn', '[data-action="confirm-cancel"]', function() {
      closeConfirmDialog();
    });
  }

  function closeConfirmDialog() {
    $('.up-confirm-backdrop').remove();
    $(document).off('click.up2a-cok click.up2a-ccn');
  }

  // ============================================================
  // SECTION 3: UNDO/REDO
  // ============================================================

  function snapshot(label) {
    S.undoStack = S.undoStack || [];
    S.undoStack.push({ label: label || '', data: deepClone(S.data) });
    if (S.undoStack.length > 50) S.undoStack.shift();
    S.redoStack = [];
  }

  function undo() {
    if (!S.undoStack || S.undoStack.length <= 1) { toast('Nothing to undo', 'info'); return; }
    S.redoStack = S.redoStack || [];
    S.redoStack.push(S.undoStack.pop());
    var prev = S.undoStack[S.undoStack.length - 1];
    S.data = deepClone(prev.data);
    buildMaps(); render(); syncToTextarea();
    toast('Undone', 'info');
  }

  function redo() {
    if (!S.redoStack || S.redoStack.length === 0) { toast('Nothing to redo', 'info'); return; }
    var next = S.redoStack.pop();
    S.undoStack.push(next);
    S.data = deepClone(next.data);
    buildMaps(); render(); syncToTextarea();
    toast('Redone', 'info');
  }

  // ============================================================
  // SECTION 4: PROVIDER CONFIGURATION MODAL (3-step flow)
  // ============================================================

  var _verifyingProvider = null;

  function openProviderModal(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) { toast('Provider not found', 'error'); return; }

    // Build catInfo — from catalog or from custom provider data
    var catInfo = Constants.MODEL_CATALOG[providerId];
    if (!catInfo) {
      // Custom provider — build a synthetic catInfo from provider data
      catInfo = {
        label: prov.label || providerId,
        icon: 'sparkles',
        category: prov.category || 'custom',
        desc: prov.custom ? 'Custom provider' : '',
        color: prov.color || '#6b7280',
        test_endpoint: prov.test_endpoint || '',
        test_method: prov.test_method || 'openai',
        models: (prov.models || []).map(function(m) { return { id: m.id, label: m.label, category: m.category || 'balanced', default_temp: m.temperature || 0.7, max_tokens: m.max_tokens || 8192 }; })
      };
    }

    var isVerified = prov.key_verified && prov.api_key;
    _verifyingProvider = providerId;

    var content = renderProviderModalContent(prov, catInfo, isVerified);

    var footerLeft = '';
    if (prov.active && prov.key_verified) {
      footerLeft = '<button class="up-btn up-btn-danger up-btn-sm" data-action="remove-provider" data-provider="' + esc(providerId) + '">' + icon('trash') + ' Remove Provider</button>';
    }

    openModal(catInfo.label, content, {
      size: 'lg',
      headerIcon: catInfo.icon,
      headerIconColor: catInfo.color,
      subtitle: catInfo.desc,
      saveLabel: isVerified ? 'Save Provider' : false,
      footerLeft: footerLeft,
      onSave: function() { saveProviderFromModal(providerId); }
    });
  }

  function renderProviderModalContent(prov, catInfo, isVerified) {
    var html = '';

    // ── Step 1: API Key ──
    html += '<div class="up-config-step">';
    html += '<div class="up-step-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--done' : 'up-step-num--active') + '">' + (isVerified ? icon('check') : '1') + '</span>';
    html += '<span class="up-step-title">API Key</span>';
    if (isVerified) html += '<span class="up-step-badge up-step-badge--success">' + icon('shield-check') + ' Verified</span>';
    html += '</div>';
    html += '<div class="up-step-body">';
    html += '<div class="up-key-row">';
    html += '<input type="text" class="up-input up-key-input" id="upProviderKey" placeholder="Enter your ' + esc(catInfo.label) + ' API key..." value="' + esc(prov.api_key || '') + '" autocomplete="off" spellcheck="false">';
    html += '<button class="up-btn ' + (isVerified ? 'up-btn-success' : 'up-btn-primary') + '" id="upVerifyBtn" data-action="verify-key" data-provider="' + esc(prov.id) + '">';
    html += isVerified ? icon('check') + ' Verified' : icon('shield-check') + ' Verify Key';
    html += '</button>';
    html += '</div>';
    html += '<div id="upVerifyStatus"></div>';
    if (prov.key_verified_at) {
      html += '<div class="up-key-meta">' + icon('clock') + ' Last verified: ' + formatRelativeTime(prov.key_verified_at) + '</div>';
    }
    html += '</div></div>';

    // ── Step 2: Select Models ──
    html += '<div class="up-config-step' + (isVerified ? '' : ' up-config-step--locked') + '" id="upModelStep">';
    html += '<div class="up-step-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--active' : '') + '">2</span>';
    html += '<span class="up-step-title">Select Models</span>';
    if (!isVerified) html += '<span class="up-step-lock">' + icon('lock') + ' Verify key first</span>';
    html += '</div>';
    if (isVerified) {
      html += '<div class="up-step-body">';
      html += renderModelSelectionList(prov, catInfo);
      html += '<button class="up-btn up-btn-xs up-btn-outline up-refresh-btn" data-action="live-refresh-modal" data-provider="' + esc(prov.id) + '" style="margin-top:var(--up-space-3)">';
      html += icon('refresh') + ' Refresh from API';
      html += '</button>';
      html += '</div>';
    }
    html += '</div>';

    // ── Step 3: Default Parameters ──
    html += '<div class="up-config-step' + (isVerified ? '' : ' up-config-step--locked') + '" id="upParamStep">';
    html += '<div class="up-step-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--active' : '') + '">3</span>';
    html += '<span class="up-step-title">Default Parameters</span>';
    if (!isVerified) html += '<span class="up-step-lock">' + icon('lock') + ' Verify key first</span>';
    html += '</div>';
    if (isVerified) {
      html += '<div class="up-step-body">';
      html += renderParameterControls(prov);
      html += '</div>';
    }
    html += '</div>';

    return html;
  }

  function renderModelSelectionList(prov, catInfo) {
    var models = prov.models || [];
    var html = '<div class="up-modal-model-list">';

    for (var i = 0; i < models.length; i++) {
      var m = models[i];
      var isOn = m.active;
      var isDef = m.is_default && isOn;
      var catLabel = Constants.CATEGORY_LABELS[m.category] || { label: m.category || '', color: '#6b7280' };

      html += '<div class="up-mm-card' + (isOn ? ' up-mm-card--on' : '') + '" data-model-id="' + esc(m.id) + '">';

      // Toggle
      html += '<label class="up-toggle-wrap">';
      html += '<input type="checkbox" class="up-mm-toggle" data-model="' + esc(m.id) + '"' + (isOn ? ' checked' : '') + '>';
      html += '<span class="up-toggle' + (isOn ? ' up-toggle--on' : '') + '"><span class="up-toggle-knob"></span></span>';
      html += '</label>';

      // Info
      html += '<div class="up-mm-info">';
      html += '<strong>' + esc(m.label) + '</strong>';
      html += '<code>' + esc(m.id) + '</code>';
      html += '</div>';

      // Category pill
      html += '<span class="up-cat-pill" style="background:' + catLabel.color + '18;color:' + catLabel.color + ';border:1px solid ' + catLabel.color + '30">' + esc(catLabel.label) + '</span>';

      // Default star
      if (isOn) {
        html += '<span class="up-star' + (isDef ? ' up-star--on' : '') + ' up-mm-star" data-model="' + esc(m.id) + '" title="' + (isDef ? 'Default model' : 'Set as default') + '">' + icon('star') + '</span>';
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderParameterControls(prov) {
    // Find first active model's params as defaults to display
    var activeModel = null;
    var models = prov.models || [];
    for (var i = 0; i < models.length; i++) {
      if (models[i].active) { activeModel = models[i]; break; }
    }
    var temp = activeModel ? (activeModel.temperature !== undefined ? activeModel.temperature : 0.7) : 0.7;
    var maxTok = activeModel ? (activeModel.max_tokens || 8192) : 8192;
    var topP = activeModel ? (activeModel.top_p !== undefined ? activeModel.top_p : 0.95) : 0.95;

    var html = '<div class="up-params-grid">';

    // Temperature
    html += '<div class="up-param-group">';
    html += '<label>Temperature</label>';
    html += '<div class="up-slider-row">';
    html += '<input type="range" class="up-range" id="upParamTemp" min="0" max="200" value="' + Math.round(temp * 100) + '" step="5">';
    html += '<span class="up-param-val" id="upParamTempVal">' + temp.toFixed(2) + '</span>';
    html += '</div>';
    html += '<div class="up-param-hint">Lower = more focused, Higher = more creative</div>';
    html += '</div>';

    // Max Tokens
    html += '<div class="up-param-group">';
    html += '<label>Max Tokens</label>';
    html += '<select class="up-select up-select-sm" id="upParamTokens">';
    var tokenOpts = [1024, 2048, 4096, 8192, 16384, 32768];
    for (var t = 0; t < tokenOpts.length; t++) {
      html += '<option value="' + tokenOpts[t] + '"' + (maxTok === tokenOpts[t] ? ' selected' : '') + '>' + tokenOpts[t].toLocaleString() + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Top P
    html += '<div class="up-param-group">';
    html += '<label>Top P</label>';
    html += '<div class="up-slider-row">';
    html += '<input type="range" class="up-range" id="upParamTopP" min="0" max="100" value="' + Math.round(topP * 100) + '" step="5">';
    html += '<span class="up-param-val" id="upParamTopPVal">' + topP.toFixed(2) + '</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  // ============================================================
  // SECTION 5: API KEY VERIFICATION
  // ============================================================

  /**
   * Builds the fetch config (endpoint, headers, body) for a provider test call.
   * Shared between verifyApiKey (modal) and quickTestConnection (inline).
   */
  function buildTestRequest(providerId, apiKey) {
    var catInfo = Constants.MODEL_CATALOG[providerId];
    var prov = S.providerMap[providerId];
    if (!apiKey) return null;

    // Determine endpoint and method — catalog first, then provider-level (custom providers)
    var endpoint = catInfo ? catInfo.test_endpoint : (prov && prov.test_endpoint ? prov.test_endpoint : null);
    var method = catInfo ? catInfo.test_method : (prov && prov.test_method ? prov.test_method : 'openai');
    if (!endpoint) return null;

    var headers = {};
    var body = null;

    switch (method) {
      case 'gemini':
        endpoint += '?key=' + encodeURIComponent(apiKey);
        headers = { 'Content-Type': 'application/json' };
        body = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
        });
        break;

      case 'claude':
        headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
        body = JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'Hello' }] });
        break;

      case 'cohere':
        headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
        body = JSON.stringify({ model: 'command-r', message: 'Hello', max_tokens: 10 });
        break;

      case 'openai':
      default:
        headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey };
        // For catalog providers use first catalog model; for custom providers use first active model or generic
        var testModel = 'gpt-4o';
        if (catInfo && catInfo.models && catInfo.models[0]) {
          testModel = catInfo.models[0].id;
        } else if (prov && prov.models && prov.models.length > 0) {
          testModel = prov.models[0].id;
        }
        body = JSON.stringify({ model: testModel, max_tokens: 10, messages: [{ role: 'user', content: 'Hello' }] });
        if (providerId === 'openrouter') {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'User Profile App';
        }
        break;
    }

    return { endpoint: endpoint, headers: headers, body: body };
  }

  function verifyApiKey(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    var key = $('#upProviderKey').val().trim();
    if (!key) { toast('Please enter an API key', 'warning'); return; }

    var req = buildTestRequest(providerId, key);
    if (!req) return;

    // Update UI to verifying state
    var $btn = $('#upVerifyBtn');
    var $status = $('#upVerifyStatus');
    $btn.removeClass('up-btn-primary up-btn-success').addClass('up-btn-loading').prop('disabled', true)
      .html('<span class="up-spinner"></span> Verifying...');
    $status.html('');

    fetch(req.endpoint, { method: 'POST', headers: req.headers, body: req.body })
      .then(function(res) {
        if (!res.ok) {
          return res.text().then(function(t) {
            var msg = 'API returned ' + res.status;
            try { msg = JSON.parse(t).error.message || msg; } catch (e) {}
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then(function(data) {
        console.log('[UP] Key verified for ' + providerId);
        onVerifySuccess(providerId, key);
      })
      .catch(function(err) {
        console.error('[UP] Key verification failed for ' + providerId + ':', err);
        onVerifyFailure(providerId, err.message);
      });
  }

  /**
   * Quick inline connectivity test — no modal needed.
   * Tests an already-configured provider's key and updates its card in place.
   */
  function quickTestConnection(providerId, callback) {
    var prov = S.providerMap[providerId];
    if (!prov || !prov.api_key) {
      toast(prov ? prov.label + ' has no API key' : 'Provider not found', 'warning');
      if (callback) callback(false);
      return;
    }

    var req = buildTestRequest(providerId, prov.api_key);
    if (!req) {
      toast('Cannot test ' + prov.label, 'warning');
      if (callback) callback(false);
      return;
    }

    // Show testing state on the card
    var $testBtn = $('[data-action="quick-test"][data-provider="' + providerId + '"]');
    $testBtn.prop('disabled', true).html('<span class="up-spinner"></span>');

    fetch(req.endpoint, { method: 'POST', headers: req.headers, body: req.body })
      .then(function(res) {
        if (!res.ok) {
          return res.text().then(function(t) {
            var msg = 'API returned ' + res.status;
            try { msg = JSON.parse(t).error.message || msg; } catch (e) {}
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then(function() {
        // Success
        prov.key_verified = true;
        prov.key_verified_at = new Date().toISOString();
        logActivity('key-verified', prov.label + ' connectivity confirmed');
        buildMaps(); syncToTextarea();
        $testBtn.prop('disabled', false).html(icon('check-circle')).addClass('up-test-pass');
        setTimeout(function() { render(); }, 1500);
        toast(prov.label + ' — connection OK', 'success');
        if (callback) callback(true);
      })
      .catch(function(err) {
        prov.key_verified = false;
        logActivity('key-failed', prov.label + ' connectivity failed: ' + (err.message || 'Unknown'));
        buildMaps(); syncToTextarea();
        $testBtn.prop('disabled', false).html(icon('triangle-exclamation')).addClass('up-test-fail');
        setTimeout(function() { render(); }, 2500);
        toast(prov.label + ' — connection failed: ' + (err.message || 'Unknown'), 'error');
        if (callback) callback(false);
      });
  }

  /**
   * Test all configured providers sequentially.
   */
  function testAllConnections() {
    var toTest = (S.data.providers || []).filter(function(p) {
      return p.api_key && p.api_key.length > 0;
    });
    if (toTest.length === 0) { toast('No providers to test', 'info'); return; }

    toast('Testing ' + toTest.length + ' provider' + (toTest.length !== 1 ? 's' : '') + '...', 'info', 2000);
    var idx = 0;
    var passed = 0;
    var failed = 0;

    function testNext() {
      if (idx >= toTest.length) {
        toast('Test complete: ' + passed + ' passed, ' + failed + ' failed', passed > 0 && failed === 0 ? 'success' : 'warning');
        render();
        return;
      }
      var p = toTest[idx];
      idx++;
      quickTestConnection(p.id, function(success) {
        if (success) passed++; else failed++;
        // Small delay between tests
        setTimeout(testNext, 500);
      });
    }

    testNext();
  }

  function onVerifySuccess(providerId, key) {
    var prov = S.providerMap[providerId];
    if (!prov) return;
    var catInfo = Constants.MODEL_CATALOG[providerId];

    // Update provider data
    var wasVerifiedBefore = prov.key_verified;
    prov.api_key = key;
    prov.key_verified = true;
    prov.key_verified_at = new Date().toISOString();
    // Auto-enable only on first-ever verification; don't override user's toggle on re-verify
    if (!wasVerifiedBefore) {
      prov.enabled = true;
    }
    prov.active = prov.enabled; // Keep active in sync for backward compat

    // Seed models from catalog if empty
    if (!prov.models || prov.models.length === 0) {
      prov.models = [];
      var catModels = catInfo ? catInfo.models : [];
      for (var i = 0; i < catModels.length; i++) {
        var cm = catModels[i];
        prov.models.push({
          id: cm.id, label: cm.label, active: false, is_default: i === 0,
          temperature: cm.default_temp, max_tokens: cm.max_tokens, top_p: 0.95,
          category: cm.category, source: 'catalog'
        });
      }
    }

    logActivity('key-verified', 'API key verified for ' + prov.label);
    snapshot('Verify ' + prov.label);
    buildMaps();
    syncToTextarea();

    // Update modal UI — unlock steps 2 & 3
    var $btn = $('#upVerifyBtn');
    $btn.removeClass('up-btn-loading').addClass('up-btn-success').prop('disabled', false)
      .html(icon('check') + ' Verified');
    $('#upVerifyStatus').html(
      '<div class="up-alert up-alert--success">' + icon('check-circle') + ' API key is valid. ' + (prov.models || []).length + ' models available in catalog.</div>'
    );

    // Unlock model step and param step
    var $modelStep = $('#upModelStep');
    $modelStep.removeClass('up-config-step--locked');
    $modelStep.find('.up-step-num').addClass('up-step-num--active');
    $modelStep.find('.up-step-lock').remove();
    // Render model list into step body
    var catRef = Constants.MODEL_CATALOG[providerId];
    // For custom providers, build a synthetic catRef
    if (!catRef && prov.custom) {
      catRef = { label: prov.label, icon: 'sparkles', color: prov.color || '#6b7280', models: (prov.models || []).map(function(m) { return { id: m.id, label: m.label, category: m.category || 'balanced', default_temp: m.temperature || 0.7, max_tokens: m.max_tokens || 8192 }; }) };
    }
    if (catRef) {
      var stepBody = '<div class="up-step-body">' + renderModelSelectionList(prov, catRef);
      if (prov.custom) {
        stepBody += '<div class="up-custom-model-add" style="margin-top:var(--up-space-3)">';
        stepBody += '<span class="up-form-hint">' + icon('info') + ' Custom providers: use Live Refresh to discover models, or add them manually via the Models view after saving.</span>';
        stepBody += '</div>';
      }
      stepBody += '<button class="up-btn up-btn-xs up-btn-outline up-refresh-btn" data-action="live-refresh-modal" data-provider="' + esc(prov.id) + '" style="margin-top:var(--up-space-3)">' + icon('refresh') + ' Refresh from API</button>';
      stepBody += '</div>';
      $modelStep.find('.up-step-body').remove();
      $modelStep.append(stepBody);
    }

    var $paramStep = $('#upParamStep');
    $paramStep.removeClass('up-config-step--locked');
    $paramStep.find('.up-step-num').addClass('up-step-num--active');
    $paramStep.find('.up-step-lock').remove();
    if (!$paramStep.find('.up-step-body').length) {
      $paramStep.append('<div class="up-step-body">' + renderParameterControls(prov) + '</div>');
    }

    // Show save button in footer
    $('.up-modal-footer-right').find('[data-action="modal-save"]').remove();
    $('.up-modal-footer-right').append('<button class="up-btn up-btn-primary" data-action="modal-save">' + icon('check') + ' Save Provider</button>');

    // Show remove button
    if (!$('.up-modal-footer-left').length) {
      $('.up-modal-footer').prepend('<div class="up-modal-footer-left"><button class="up-btn up-btn-danger up-btn-sm" data-action="remove-provider" data-provider="' + esc(providerId) + '">' + icon('trash') + ' Remove Provider</button></div>');
    }
  }

  function onVerifyFailure(providerId, errorMsg) {
    var $btn = $('#upVerifyBtn');
    $btn.removeClass('up-btn-loading').addClass('up-btn-primary').prop('disabled', false)
      .html(icon('shield-check') + ' Retry Verification');

    var prov = S.providerMap[providerId];
    if (prov) {
      prov.key_verified = false;
      logActivity('key-failed', 'API key verification failed for ' + prov.label + ': ' + (errorMsg || 'Unknown error'));
    }

    $('#upVerifyStatus').html(
      '<div class="up-alert up-alert--error">' + icon('warning') + ' Verification failed: ' + esc(truncate(errorMsg || 'Unknown error', 100)) + '</div>'
    );
  }

  // ============================================================
  // SECTION 6: PROVIDER SAVE & REMOVE
  // ============================================================

  function saveProviderFromModal(providerId) {
    var prov = S.providerMap[providerId || _verifyingProvider];
    if (!prov) { closeModal(); return; }

    // Collect model toggles
    $('.up-mm-toggle').each(function() {
      var modelId = $(this).data('model');
      var isChecked = $(this).is(':checked');
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) {
          models[i].active = isChecked;
          break;
        }
      }
    });

    // Collect default stars
    var defaultModelId = null;
    $('.up-mm-star.up-star--on').each(function() {
      defaultModelId = $(this).data('model');
    });
    if (defaultModelId) {
      var models = prov.models || [];
      for (var j = 0; j < models.length; j++) {
        models[j].is_default = (models[j].id === defaultModelId);
      }
    }

    // Collect parameters and apply to all active models
    var temp = parseFloat($('#upParamTemp').val()) / 100;
    var maxTok = parseInt($('#upParamTokens').val(), 10) || 8192;
    var topP = parseFloat($('#upParamTopP').val()) / 100;

    if (!isNaN(temp) && !isNaN(topP)) {
      var models2 = prov.models || [];
      for (var k = 0; k < models2.length; k++) {
        if (models2[k].active) {
          models2[k].temperature = Math.round(temp * 100) / 100;
          models2[k].max_tokens = maxTok;
          models2[k].top_p = Math.round(topP * 100) / 100;
        }
      }
    }

    // Update API key if changed
    var newKey = $('#upProviderKey').val().trim();
    if (newKey && newKey !== prov.api_key) {
      prov.api_key = newKey;
      // If key changed but not verified, mark unverified and disable
      if (!prov.key_verified) {
        prov.enabled = false;
        prov.active = false;
      }
    }
    // Keep active in sync with enabled
    prov.active = prov.enabled;

    // Auto-set profile default if none exists
    if (!S.data.default_provider || !S.providerMap[S.data.default_provider] || !S.providerMap[S.data.default_provider].enabled) {
      var activeModels = (prov.models || []).filter(function(m) { return m.active; });
      if (prov.enabled && prov.key_verified && activeModels.length > 0) {
        S.data.default_provider = prov.id;
        var defM = activeModels.find(function(m) { return m.is_default; }) || activeModels[0];
        S.data.default_model = defM ? defM.id : '';
        logActivity('default-changed', 'Profile default set to ' + prov.label + ' / ' + (defM ? defM.label : ''));
      }
    }

    var activeModelCount = (prov.models || []).filter(function(m) { return m.active; }).length;
    logActivity('provider-configured', prov.label + ' saved with ' + activeModelCount + ' active model' + (activeModelCount !== 1 ? 's' : ''));
    snapshot('Save ' + prov.label);
    buildMaps();
    syncToTextarea();
    closeModal();
    render();
    toast(prov.label + ' configuration saved', 'success');
  }

  function removeProvider(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    openConfirmDialog({
      title: 'Remove ' + prov.label,
      message: 'This will clear the API key and disable all models for ' + prov.label + '. Are you sure?',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: function() {
        prov.api_key = '';
        prov.key_verified = false;
        prov.key_verified_at = null;
        prov.active = false;
        prov.enabled = false;
        var models = prov.models || [];
        for (var i = 0; i < models.length; i++) { models[i].active = false; }

        // If this was the default provider, clear default
        if (S.data.default_provider === providerId) {
          S.data.default_provider = '';
          S.data.default_model = '';
          // Auto-assign new default if another provider is exportable
          for (var j = 0; j < (S.data.providers || []).length; j++) {
            var other = S.data.providers[j];
            if (other.enabled && other.key_verified && other.id !== providerId) {
              var otherActive = (other.models || []).filter(function(m) { return m.active; });
              if (otherActive.length > 0) {
                S.data.default_provider = other.id;
                var defM = otherActive.find(function(m) { return m.is_default; }) || otherActive[0];
                S.data.default_model = defM ? defM.id : '';
                break;
              }
            }
          }
        }

        logActivity('provider-removed', prov.label + ' provider removed');
        snapshot('Remove ' + prov.label);
        buildMaps();
        syncToTextarea();
        closeModal();
        render();
        toast(prov.label + ' removed', 'success');
      }
    });
  }

  // ============================================================
  // SECTION 7: CHANGE DEFAULT MODAL
  // ============================================================

  function openChangeDefaultModal() {
    var html = '<div class="up-editor-form">';
    html += '<div class="up-form-group"><label>Default Provider</label>';
    html += '<select class="up-select" id="upDefaultProvider">';
    html += '<option value="">— Select —</option>';

    var providers = S.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      if (!p.enabled || !p.key_verified) continue;
      var activeModels = (p.models || []).filter(function(m) { return m.active; });
      if (activeModels.length === 0) continue;
      html += '<option value="' + esc(p.id) + '"' + (S.data.default_provider === p.id ? ' selected' : '') + '>' + esc(p.label) + ' (' + activeModels.length + ' models)</option>';
    }
    html += '</select></div>';

    // Model select (populated dynamically)
    html += '<div class="up-form-group"><label>Default Model</label>';
    html += '<select class="up-select" id="upDefaultModel">';
    if (S.data.default_provider && S.providerMap[S.data.default_provider]) {
      var curProv = S.providerMap[S.data.default_provider];
      var curModels = (curProv.models || []).filter(function(m) { return m.active; });
      for (var j = 0; j < curModels.length; j++) {
        html += '<option value="' + esc(curModels[j].id) + '"' + (S.data.default_model === curModels[j].id ? ' selected' : '') + '>' + esc(curModels[j].label) + '</option>';
      }
    }
    html += '</select></div>';
    html += '</div>';

    openModal('Change Profile Default', html, {
      size: 'sm',
      saveLabel: 'Set Default',
      onSave: function() { saveDefaultFromModal(); }
    });
  }

  function saveDefaultFromModal() {
    var providerId = $('#upDefaultProvider').val();
    var modelId = $('#upDefaultModel').val();

    if (!providerId || !modelId) { toast('Select a provider and model', 'warning'); return; }

    S.data.default_provider = providerId;
    S.data.default_model = modelId;

    var prov = S.providerMap[providerId];
    var modelLabel = modelId;
    if (prov) {
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) { modelLabel = models[i].label; break; }
      }
    }

    logActivity('default-changed', 'Profile default set to ' + (prov ? prov.label : providerId) + ' / ' + modelLabel);
    snapshot('Change default');
    buildMaps();
    syncToTextarea();
    closeModal();
    render();
    toast('Profile default updated', 'success');
  }

  // ============================================================
  // SECTION 7B: ADD CUSTOM PROVIDER MODAL
  // ============================================================

  function openAddCustomProviderModal() {
    var html = '<div class="up-editor-form">';

    html += '<div class="up-alert up-alert--info" style="margin-bottom:var(--up-space-4)">';
    html += icon('info') + ' Add a provider not in our catalog. We\'ll auto-detect the auth method when you verify the key.';
    html += '</div>';

    html += '<div class="up-form-group"><label>Provider Name <span class="up-required">*</span></label>';
    html += '<input type="text" class="up-input" id="upCustomName" placeholder="e.g. MyProvider AI">';
    html += '</div>';

    html += '<div class="up-form-group"><label>Provider ID <span class="up-required">*</span></label>';
    html += '<input type="text" class="up-input" id="upCustomId" placeholder="e.g. myprovider (lowercase, no spaces)">';
    html += '<span class="up-form-hint">Unique identifier — lowercase, no spaces. Used internally.</span>';
    html += '</div>';

    html += '<div class="up-form-group"><label>API Endpoint URL <span class="up-required">*</span></label>';
    html += '<input type="url" class="up-input" id="upCustomEndpoint" placeholder="https://api.example.com/v1/chat/completions">';
    html += '<span class="up-form-hint">The chat completions endpoint. Most OpenAI-compatible APIs use <code>/v1/chat/completions</code></span>';
    html += '</div>';

    html += '<div class="up-form-group"><label>API Key <span class="up-required">*</span></label>';
    html += '<input type="password" class="up-input up-key-input" id="upCustomKey" placeholder="Enter API key">';
    html += '</div>';

    html += '</div>';

    openModal(icon('plus') + ' Add Custom Provider', html, {
      size: 'md',
      saveLabel: 'Add & Verify',
      onSave: function() { saveCustomProvider(); }
    });

    // Auto-generate ID from name
    $(document).off('input.up2a-cname', '#upCustomName').on('input.up2a-cname', '#upCustomName', function() {
      var name = $(this).val().trim();
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var $idField = $('#upCustomId');
      if (!$idField.data('manual')) {
        $idField.val(id);
      }
    });
    $(document).off('input.up2a-cid', '#upCustomId').on('input.up2a-cid', '#upCustomId', function() {
      $(this).data('manual', true);
    });
  }

  function saveCustomProvider() {
    var name = $('#upCustomName').val().trim();
    var id = $('#upCustomId').val().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    var endpoint = $('#upCustomEndpoint').val().trim();
    var key = $('#upCustomKey').val().trim();

    // Validate
    if (!name) { toast('Provider name is required', 'warning'); return; }
    if (!id) { toast('Provider ID is required', 'warning'); return; }
    if (!endpoint) { toast('API endpoint URL is required', 'warning'); return; }
    if (!key) { toast('API key is required', 'warning'); return; }

    // Check for duplicate ID
    if (S.providerMap[id]) {
      toast('A provider with ID "' + id + '" already exists', 'error');
      return;
    }

    // Validate URL
    try { new URL(endpoint); } catch (e) {
      toast('Invalid URL format', 'warning');
      return;
    }

    // Create provider entry
    var newProvider = {
      id: id,
      label: name,
      active: false,
      enabled: false,
      api_key: key,
      key_verified: false,
      key_verified_at: null,
      category: 'custom',
      models: [],
      last_live_refresh: null,
      custom: true,
      test_endpoint: endpoint,
      test_method: 'openai',
      color: generateCustomColor(id)
    };

    S.data.providers.push(newProvider);
    logActivity('provider-configured', 'Custom provider "' + name + '" added');
    snapshot('Add custom ' + name);
    buildMaps();
    syncToTextarea();
    closeModal();

    // Immediately try to verify
    toast('Provider added — verifying key...', 'info', 2000);
    setTimeout(function() {
      quickTestConnection(id, function(success) {
        if (success) {
          // On success, auto-enable and open config modal
          var prov = S.providerMap[id];
          if (prov) {
            prov.enabled = true;
            prov.active = true;
            buildMaps();
            syncToTextarea();
          }
          render();
          toast(name + ' verified and enabled! Add models via Manage.', 'success');
        } else {
          render();
          toast(name + ' added but key verification failed. Open Manage to re-enter key.', 'warning');
        }
      });
    }, 300);
  }

  function generateCustomColor(id) {
    // Generate a consistent color from provider ID string
    var hash = 0;
    for (var i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
    var hue = Math.abs(hash % 360);
    return 'hsl(' + hue + ', 55%, 45%)';
  }

  // ============================================================
  // SECTION 8: EVENTS
  // ============================================================

  function setupPart2AEvents() {
    // Close modal
    $(document).off('click.up2a-cm', '[data-action="close-modal"]').on('click.up2a-cm', '[data-action="close-modal"]', function(e) {
      e.preventDefault();
      closeModal();
    });
    $(document).off('click.up2a-cb', '.up-modal-backdrop').on('click.up2a-cb', '.up-modal-backdrop', function(e) {
      if ($(e.target).hasClass('up-modal-backdrop')) closeModal();
    });

    // Modal save
    $(document).off('click.up2a-ms', '[data-action="modal-save"]').on('click.up2a-ms', '[data-action="modal-save"]', function(e) {
      e.preventDefault();
      if (currentModal && currentModal.onSave) {
        currentModal.onSave();
      } else if (_verifyingProvider) {
        saveProviderFromModal(_verifyingProvider);
      }
    });

    // Verify key
    $(document).off('click.up2a-vk', '[data-action="verify-key"]').on('click.up2a-vk', '[data-action="verify-key"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider');
      verifyApiKey(providerId);
    });

    // Allow Enter key to trigger verify
    $(document).off('keydown.up2a-vke', '#upProviderKey').on('keydown.up2a-vke', '#upProviderKey', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#upVerifyBtn').click();
      }
    });

    // Model toggle in modal
    $(document).off('change.up2a-mt', '.up-mm-toggle').on('change.up2a-mt', '.up-mm-toggle', function() {
      var $card = $(this).closest('.up-mm-card');
      var isOn = $(this).is(':checked');
      var $toggle = $card.find('.up-toggle');
      if (isOn) {
        $card.addClass('up-mm-card--on');
        $toggle.addClass('up-toggle--on');
        // Show star
        var modelId = $(this).data('model');
        if (!$card.find('.up-mm-star').length) {
          $card.append('<span class="up-star up-mm-star" data-model="' + esc(modelId) + '" title="Set as default">' + icon('star') + '</span>');
        }
      } else {
        $card.removeClass('up-mm-card--on');
        $toggle.removeClass('up-toggle--on');
        $card.find('.up-mm-star').remove();
      }
    });

    // Model default star in modal
    $(document).off('click.up2a-mds', '.up-mm-star').on('click.up2a-mds', '.up-mm-star', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.up-mm-star').removeClass('up-star--on');
      $(this).addClass('up-star--on');
    });

    // Remove provider
    $(document).off('click.up2a-rp', '[data-action="remove-provider"]').on('click.up2a-rp', '[data-action="remove-provider"]', function(e) {
      e.preventDefault();
      removeProvider($(this).data('provider'));
    });

    // Change default
    $(document).off('click.up2a-cd', '[data-action="change-default"]').on('click.up2a-cd', '[data-action="change-default"]', function(e) {
      e.preventDefault();
      openChangeDefaultModal();
    });

    // Default provider select → update model options
    $(document).off('change.up2a-dp', '#upDefaultProvider').on('change.up2a-dp', '#upDefaultProvider', function() {
      var pid = $(this).val();
      var $modelSelect = $('#upDefaultModel').empty();
      if (!pid || !S.providerMap[pid]) return;
      var models = (S.providerMap[pid].models || []).filter(function(m) { return m.active; });
      for (var i = 0; i < models.length; i++) {
        $modelSelect.append('<option value="' + esc(models[i].id) + '">' + esc(models[i].label) + '</option>');
      }
    });

    // Temperature slider
    $(document).off('input.up2a-ts', '#upParamTemp').on('input.up2a-ts', '#upParamTemp', function() {
      var val = (parseFloat($(this).val()) / 100).toFixed(2);
      $('#upParamTempVal').text(val);
    });

    // Top P slider
    $(document).off('input.up2a-tp', '#upParamTopP').on('input.up2a-tp', '#upParamTopP', function() {
      var val = (parseFloat($(this).val()) / 100).toFixed(2);
      $('#upParamTopPVal').text(val);
    });

    // Undo/Redo keyboard shortcuts
    $(document).off('keydown.up2a-ur').on('keydown.up2a-ur', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    });

    // Quick test connection (inline on provider card)
    $(document).off('click.up2a-qt', '[data-action="quick-test"]').on('click.up2a-qt', '[data-action="quick-test"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      quickTestConnection($(this).data('provider'));
    });

    // Test all connections
    $(document).off('click.up2a-ta', '[data-action="test-all-connections"]').on('click.up2a-ta', '[data-action="test-all-connections"]', function(e) {
      e.preventDefault();
      testAllConnections();
    });

    // Escape to close modal
    $(document).off('keydown.up2a-esc').on('keydown.up2a-esc', function(e) {
      if (e.key === 'Escape') {
        if ($('.up-confirm-backdrop').length) closeConfirmDialog();
        else if ($('.up-modal-backdrop').length) closeModal();
      }
    });
  }

  // ============================================================
  // SECTION 9: API EXPORTS
  // ============================================================

  window._upPart2A = {
    snapshot: snapshot,
    undo: undo,
    redo: redo,
    openModal: openModal,
    closeModal: closeModal,
    openConfirmDialog: openConfirmDialog,
    closeConfirmDialog: closeConfirmDialog,
    openProviderModal: openProviderModal,
    saveProviderFromModal: saveProviderFromModal,
    removeProvider: removeProvider,
    openChangeDefaultModal: openChangeDefaultModal,
    openAddCustomProviderModal: openAddCustomProviderModal,
    verifyApiKey: verifyApiKey,
    quickTestConnection: quickTestConnection,
    testAllConnections: testAllConnections
  };

  console.log('[UP] Part 2A loaded');
})(jQuery, Drupal);

/* ===== src/30-part2b/up-part2b.js ===== */
/**
 * User Profile App v1.0 - Part 2B: Advanced Features
 *
 * Live model refresh, LLM config preview modal, import/export,
 * bulk model operations, data reset, keyboard shortcuts.
 *
 * Sections:
 *  1. Init & Imports
 *  2. Live Model Refresh (API-based model discovery)
 *  3. LLM Config Preview Modal
 *  4. Import / Export
 *  5. Bulk Model Operations
 *  6. Data Reset
 *  7. Keyboard Shortcuts
 *  8. Events
 *  9. API Exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

  // ============================================================
  // SECTION 1: INIT & IMPORTS
  // ============================================================

  var S, render, navigate, toast, generateId, buildMaps, syncToTextarea;
  var esc, deepClone, icon, logActivity, formatDate, formatRelativeTime, maskKey;
  var Constants, buildLLMConfig, getProviderColor;
  var snapshot, openModal, closeModal, openConfirmDialog, closeConfirmDialog;

  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    if (window._upPart2A && window._upState && window._upState.initialized) {
      clearInterval(checkInterval);
      initPart2B();
    } else if (_checkCount > 150) {
      clearInterval(checkInterval);
      console.error('[UP] Part 2B: Timed out waiting for Part 2A');
    }
  }, 100);

  function initPart2B() {
    console.log('[UP] Initializing Part 2B...');

    S = window._upState;
    render = window._upRender;
    navigate = window._upNavigate;
    toast = window._upToast;
    generateId = window._upGenerateId;
    buildMaps = window._upBuildMaps;
    syncToTextarea = window._upSyncToTextarea;
    esc = window._upEsc;
    deepClone = window._upDeepClone;
    icon = window._upIcon;
    logActivity = window._upLogActivity;
    formatDate = window._upFormatDate;
    formatRelativeTime = window._upFormatRelativeTime;
    maskKey = window._upMaskKey;
    Constants = window._upConstants;
    buildLLMConfig = window._upBuildLLMConfig;
    getProviderColor = window._upGetProviderColor;

    var P2A = window._upPart2A;
    snapshot = P2A.snapshot;
    openModal = P2A.openModal;
    closeModal = P2A.closeModal;
    openConfirmDialog = P2A.openConfirmDialog;
    closeConfirmDialog = P2A.closeConfirmDialog;

    setupPart2BEvents();
    setupKeyboardShortcuts();

    if (render) render();
    console.log('[UP] Part 2B initialized');
  }

  // ============================================================
  // SECTION 2: LIVE MODEL REFRESH
  // ============================================================

  /**
   * Model list API endpoints by provider.
   * Not all providers expose a public model-listing endpoint.
   * For those that do, we call it and merge discovered models into the catalog.
   */
  var MODEL_LIST_ENDPOINTS = {
    'openai':      { url: 'https://api.openai.com/v1/models', method: 'bearer', parser: 'openai' },
    'groq':        { url: 'https://api.groq.com/openai/v1/models', method: 'bearer', parser: 'openai' },
    'mistral':     { url: 'https://api.mistral.ai/v1/models', method: 'bearer', parser: 'openai' },
    'together':    { url: 'https://api.together.xyz/v1/models', method: 'bearer', parser: 'openai' },
    'openrouter':  { url: 'https://openrouter.ai/api/v1/models', method: 'none', parser: 'openrouter' },
    'nvidia':      { url: 'https://integrate.api.nvidia.com/v1/models', method: 'bearer', parser: 'openai' },
    'deepseek':    { url: 'https://api.deepseek.com/models', method: 'bearer', parser: 'openai' },
    'perplexity':  { url: 'https://api.perplexity.ai/models', method: 'bearer', parser: 'openai' }
  };

  function liveRefreshModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov || !prov.api_key || !prov.key_verified) {
      toast('Provider not configured or key not verified', 'warning');
      return;
    }

    var endpoint = MODEL_LIST_ENDPOINTS[providerId];
    if (!endpoint) {
      toast(prov.label + ' does not support live model refresh. Using catalog models.', 'info');
      return;
    }

    toast('Refreshing models for ' + prov.label + '...', 'info', 2000);

    // Disable refresh buttons for this provider
    var $refreshBtns = $('[data-action="live-refresh"][data-provider="' + providerId + '"], [data-action="live-refresh-modal"][data-provider="' + providerId + '"]');
    $refreshBtns.prop('disabled', true).addClass('up-btn-loading').html('<span class="up-spinner"></span> Refreshing...');

    var headers = { 'Content-Type': 'application/json' };
    if (endpoint.method === 'bearer') {
      headers['Authorization'] = 'Bearer ' + prov.api_key;
    }
    if (providerId === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
    }

    fetch(endpoint.url, { method: 'GET', headers: headers })
      .then(function(res) {
        if (!res.ok) throw new Error('API returned ' + res.status);
        return res.json();
      })
      .then(function(data) {
        var discovered = parseModelList(providerId, data, endpoint.parser);
        mergeDiscoveredModels(providerId, discovered);
      })
      .catch(function(err) {
        console.error('[UP] Live refresh failed for ' + providerId + ':', err);
        toast('Model refresh failed: ' + (err.message || 'Unknown error'), 'error');
        // Re-enable buttons on failure
        $refreshBtns.prop('disabled', false).removeClass('up-btn-loading').html(icon('refresh') + ' Refresh');
      });
  }

  function parseModelList(providerId, data, parser) {
    var models = [];

    if (parser === 'openai') {
      // Standard OpenAI-compatible /v1/models response
      var items = data.data || data.models || [];
      for (var i = 0; i < items.length; i++) {
        var m = items[i];
        var id = m.id || m.name || '';
        if (!id) continue;
        // Filter: skip embedding, moderation, tts, whisper, dall-e models
        var lower = id.toLowerCase();
        if (lower.indexOf('embed') > -1 || lower.indexOf('moderation') > -1 ||
            lower.indexOf('tts') > -1 || lower.indexOf('whisper') > -1 ||
            lower.indexOf('dall-e') > -1 || lower.indexOf('audio') > -1) continue;

        models.push({
          id: id,
          label: m.name || m.id || id,
          category: guessCategory(id),
          source: 'live_refresh'
        });
      }
    } else if (parser === 'openrouter') {
      // OpenRouter has a different structure
      var items2 = data.data || [];
      for (var j = 0; j < items2.length; j++) {
        var m2 = items2[j];
        models.push({
          id: m2.id || '',
          label: m2.name || m2.id || '',
          category: guessCategory(m2.id || ''),
          source: 'live_refresh'
        });
      }
    }

    return models;
  }

  function guessCategory(modelId) {
    var lower = (modelId || '').toLowerCase();
    if (lower.indexOf('405b') > -1 || lower.indexOf('opus') > -1 || lower.indexOf('pro') > -1 ||
        lower.indexOf('large') > -1 || lower.indexOf('grok-3') === 0 || lower.indexOf('r1') > -1 ||
        lower.indexOf('o3') > -1 || lower.indexOf('o1') > -1 || lower.indexOf('deep-research') > -1) {
      return 'powerful';
    }
    if (lower.indexOf('mini') > -1 || lower.indexOf('nano') > -1 || lower.indexOf('flash') > -1 ||
        lower.indexOf('lite') > -1 || lower.indexOf('8b') > -1 || lower.indexOf('small') > -1 ||
        lower.indexOf('haiku') > -1 || lower.indexOf('instant') > -1) {
      return 'fast';
    }
    return 'balanced';
  }

  function mergeDiscoveredModels(providerId, discovered) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    prov.models = prov.models || [];
    var existingIds = {};
    for (var i = 0; i < prov.models.length; i++) {
      existingIds[prov.models[i].id] = true;
    }

    var newCount = 0;
    for (var j = 0; j < discovered.length; j++) {
      var dm = discovered[j];
      if (existingIds[dm.id]) continue;
      prov.models.push({
        id: dm.id,
        label: dm.label || dm.id,
        active: false,
        is_default: false,
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
        category: dm.category || 'balanced',
        source: 'live_refresh'
      });
      newCount++;
    }

    prov.last_live_refresh = new Date().toISOString();

    if (newCount > 0) {
      logActivity('model-toggled', newCount + ' new model' + (newCount !== 1 ? 's' : '') + ' discovered for ' + prov.label + ' via API refresh');
      snapshot('Live refresh ' + prov.label);
      buildMaps();
      syncToTextarea();
      render();
      toast(newCount + ' new model' + (newCount !== 1 ? 's' : '') + ' discovered for ' + prov.label, 'success');
    } else {
      toast('No new models found for ' + prov.label + '. Catalog is up to date.', 'info');
    }
  }

  // ============================================================
  // SECTION 3: LLM CONFIG PREVIEW MODAL
  // ============================================================

  function openLLMConfigPreview() {
    var config = buildLLMConfig();
    var jsonStr = JSON.stringify(config, null, 2);
    var htmlWrapped = '<div class="llm-config-data">' + JSON.stringify(config) + '</div>';
    var provCount = config.providers ? config.providers.length : 0;
    var modelCount = 0;
    if (config.providers) {
      for (var i = 0; i < config.providers.length; i++) {
        modelCount += (config.providers[i].models || []).length;
      }
    }

    var html = '';

    // Info bar
    html += '<div class="up-preview-info">';
    html += '<span class="up-preview-stat">' + icon('bolt') + ' ' + provCount + ' provider' + (provCount !== 1 ? 's' : '') + '</span>';
    html += '<span class="up-preview-stat">' + icon('layer-group') + ' ' + modelCount + ' model' + (modelCount !== 1 ? 's' : '') + '</span>';
    if (config.default_provider) html += '<span class="up-preview-stat">' + icon('star') + ' Default: ' + esc(config.default_provider) + '/' + esc(config.default_model) + '</span>';
    html += '</div>';

    // Tabs
    html += '<div class="up-preview-tabs">';
    html += '<button class="up-preview-tab up-preview-tab--active" data-action="preview-tab" data-tab="json">JSON Preview</button>';
    html += '<button class="up-preview-tab" data-action="preview-tab" data-tab="html">HTML Output</button>';
    html += '<button class="up-preview-tab" data-action="preview-tab" data-tab="consumers">Consuming Apps</button>';
    html += '</div>';

    // JSON tab
    html += '<div class="up-preview-panel" id="upPreviewJson">';
    html += '<div class="up-code-block">';
    html += '<div class="up-code-header"><span>' + icon('code') + ' llm-config.json</span>';
    html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="copy-json">' + icon('copy') + ' Copy</button></div>';
    html += '<pre class="up-code-body" id="upConfigJsonText">' + esc(jsonStr) + '</pre>';
    html += '</div></div>';

    // HTML tab
    html += '<div class="up-preview-panel up-preview-panel--hidden" id="upPreviewHtml">';
    html += '<div class="up-code-block">';
    html += '<div class="up-code-header"><span>' + icon('code') + ' field_llm_config HTML</span>';
    html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="copy-html">' + icon('copy') + ' Copy</button></div>';
    html += '<pre class="up-code-body up-code-body--sm" id="upConfigHtmlText">' + esc(htmlWrapped) + '</pre>';
    html += '</div></div>';

    // Consumers tab
    html += '<div class="up-preview-panel up-preview-panel--hidden" id="upPreviewConsumers">';
    var apps = [
      { name: 'YouTube Video Planner', prefix: 'yvp', color: '#FF0000' },
      { name: 'Social Content Planner', prefix: 'scp', color: '#1a73e8' },
      { name: 'Video Production', prefix: 'vp', color: '#8b5cf6' },
      { name: 'GTM Planner', prefix: 'gtm', color: '#0d904f' },
      { name: 'Local Business Website Planner', prefix: 'lbwp', color: '#e37400' }
    ];
    html += '<div class="up-consumer-list">';
    for (var a = 0; a < apps.length; a++) {
      html += '<div class="up-consumer-card">';
      html += '<span class="up-consumer-dot" style="background:' + apps[a].color + '"></span>';
      html += '<span class="up-consumer-name">' + esc(apps[a].name) + '</span>';
      html += '<code class="up-consumer-code">.llm-config-data</code>';
      html += '<span class="up-consumer-status">' + icon('check-circle') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="up-consumer-note">' + icon('info') + ' All apps read the <code>.llm-config-data</code> div injected by Drupal from <code>field_llm_config</code>.</div>';
    html += '</div>';

    openModal(icon('code') + ' LLM Config Preview', html, {
      size: 'lg',
      footer: false
    });
  }

  // ============================================================
  // SECTION 4: IMPORT / EXPORT
  // ============================================================

  function exportJSON() {
    var exportData = {
      _format: 'up-data-v1',
      _app: 'user_profile',
      _version: '1.0.0',
      _exported: new Date().toISOString(),
      data: deepClone(S.data)
    };

    // Mask API keys in export for safety
    var providers = exportData.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].api_key) {
        providers[i].api_key = maskKey(providers[i].api_key) + '_MASKED';
      }
    }

    var json = JSON.stringify(exportData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'user-profile-config-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity('settings-changed', 'Configuration exported');
    toast('Configuration exported (API keys are masked)', 'success');
  }

  function exportJSONWithKeys() {
    openConfirmDialog({
      title: 'Export with API Keys',
      message: 'This will export your full configuration including unmasked API keys. Only do this for backup purposes. Keep the file secure.',
      confirmLabel: 'Export with Keys',
      danger: true,
      onConfirm: function() {
        var exportData = {
          _format: 'up-data-v1',
          _app: 'user_profile',
          _version: '1.0.0',
          _exported: new Date().toISOString(),
          data: deepClone(S.data)
        };

        var json = JSON.stringify(exportData, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'user-profile-config-full-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logActivity('settings-changed', 'Configuration exported with API keys');
        toast('Full configuration exported', 'success');
      }
    });
  }

  function importJSON() {
    var $input = $('<input type="file" accept=".json" style="display:none">');
    $('body').append($input);

    $input.on('change', function() {
      var file = this.files[0];
      if (!file) { $input.remove(); return; }

      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var imported = JSON.parse(e.target.result);

          // Validate format
          if (!imported._format && !imported.data) {
            toast('Invalid file format. Expected User Profile export.', 'error');
            $input.remove();
            return;
          }

          var providerCount = 0;
          var importData = imported.data || imported;
          if (importData.providers) {
            providerCount = importData.providers.filter(function(p) { return p.api_key && p.api_key.length > 0 && p.api_key.indexOf('_MASKED') === -1; }).length;
          }

          var msg = 'Import this configuration?';
          if (providerCount > 0) {
            msg += ' Found ' + providerCount + ' provider' + (providerCount !== 1 ? 's' : '') + ' with API keys.';
          } else {
            msg += ' Note: API keys appear to be masked — you may need to re-enter them after import.';
          }

          openConfirmDialog({
            title: 'Import Configuration',
            message: msg + ' Current configuration will be replaced.',
            confirmLabel: 'Import',
            danger: true,
            onConfirm: function() {
              var newData = imported.data || imported;
              // Preserve structure
              S.data = newData;
              S.data.providers = S.data.providers || [];
              S.data.default_provider = S.data.default_provider || '';
              S.data.default_model = S.data.default_model || '';
              S.data.preferences = S.data.preferences || { auto_sync_llm_config: true, timezone: 'UTC' };
              S.data.activity = S.data.activity || [];

              // Strip masked keys
              for (var i = 0; i < S.data.providers.length; i++) {
                var p = S.data.providers[i];
                if (p.api_key && p.api_key.indexOf('_MASKED') > -1) {
                  p.api_key = '';
                  p.key_verified = false;
                  p.active = false;
                }
              }

              logActivity('settings-changed', 'Configuration imported from file');
              snapshot('Import');
              buildMaps();
              syncToTextarea();
              render();
              toast('Configuration imported', 'success');
            }
          });
        } catch (err) {
          toast('Invalid JSON file: ' + (err.message || 'Parse error'), 'error');
        }
        $input.remove();
      };
      reader.readAsText(file);
    });

    $input.click();
  }

  // ============================================================
  // SECTION 5: BULK MODEL OPERATIONS
  // ============================================================

  function enableAllModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov || !prov.key_verified) return;

    var models = prov.models || [];
    var changed = 0;
    for (var i = 0; i < models.length; i++) {
      if (!models[i].active) {
        models[i].active = true;
        changed++;
      }
    }

    if (changed > 0) {
      logActivity('model-toggled', 'Enabled all ' + models.length + ' models for ' + prov.label);
      snapshot('Enable all models');
      buildMaps();
      syncToTextarea();
      render();
      toast('All models enabled for ' + prov.label, 'success');
    } else {
      toast('All models already enabled', 'info');
    }
  }

  function disableAllModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    var models = prov.models || [];
    var changed = 0;
    for (var i = 0; i < models.length; i++) {
      if (models[i].active) {
        models[i].active = false;
        changed++;
      }
    }

    if (changed > 0) {
      logActivity('model-toggled', 'Disabled all models for ' + prov.label);
      snapshot('Disable all models');
      buildMaps();
      syncToTextarea();
      render();
      toast('All models disabled for ' + prov.label, 'success');
    } else {
      toast('All models already disabled', 'info');
    }
  }

  // ============================================================
  // SECTION 6: DATA RESET
  // ============================================================

  function resetAllProviders() {
    openConfirmDialog({
      title: 'Reset All Providers',
      message: 'This will clear all API keys, disable all models, and reset the entire configuration to defaults. This cannot be undone. Are you absolutely sure?',
      confirmLabel: 'Reset Everything',
      danger: true,
      onConfirm: function() {
        // Reset all providers
        var providers = S.data.providers || [];
        for (var i = 0; i < providers.length; i++) {
          providers[i].api_key = '';
          providers[i].key_verified = false;
          providers[i].key_verified_at = null;
          providers[i].active = false;
          providers[i].enabled = false;
          providers[i].last_live_refresh = null;
          var models = providers[i].models || [];
          for (var j = 0; j < models.length; j++) {
            models[j].active = false;
          }
        }

        S.data.default_provider = '';
        S.data.default_model = '';

        logActivity('provider-removed', 'All providers reset to defaults');
        snapshot('Reset all');
        buildMaps();
        syncToTextarea();
        render();
        toast('All providers reset', 'success');
      }
    });
  }

  function clearActivityLog() {
    openConfirmDialog({
      title: 'Clear Activity Log',
      message: 'This will permanently delete all activity log entries.',
      confirmLabel: 'Clear Log',
      danger: true,
      onConfirm: function() {
        S.data.activity = [];
        snapshot('Clear activity');
        syncToTextarea();
        render();
        toast('Activity log cleared', 'success');
      }
    });
  }

  // ============================================================
  // SECTION 7: KEYBOARD SHORTCUTS
  // ============================================================

  function setupKeyboardShortcuts() {
    $(document).off('keydown.up2b-nav').on('keydown.up2b-nav', function(e) {
      // Don't handle shortcuts when typing in inputs
      if ($(e.target).is('input, textarea, select, [contenteditable="true"]')) return;

      // Alt+1/2/3 for view navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1': e.preventDefault(); navigate('dashboard'); break;
          case '2': e.preventDefault(); navigate('providers'); break;
          case '3': e.preventDefault(); navigate('models'); break;
        }
      }

      // Ctrl+Shift+E → Export
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportJSON();
      }

      // Ctrl+S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        syncToTextarea();
        if (S.$submitBtn && S.$submitBtn.length) S.$submitBtn.click();
      }
    });
  }

  // ============================================================
  // SECTION 8: EVENTS
  // ============================================================

  function setupPart2BEvents() {
    // Live refresh (from Models view)
    $(document).off('click.up2b-lr', '[data-action="live-refresh"]').on('click.up2b-lr', '[data-action="live-refresh"]', function(e) {
      e.preventDefault();
      liveRefreshModels($(this).data('provider'));
    });

    // Live refresh inside modal
    $(document).off('click.up2b-lrm', '[data-action="live-refresh-modal"]').on('click.up2b-lrm', '[data-action="live-refresh-modal"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider');
      liveRefreshModels(providerId);
      // Re-render will close/update modal — inform user
      toast('Model list will update after refresh completes', 'info', 2000);
    });

    // Export
    $(document).off('click.up2b-exp', '[data-action="export-config"]').on('click.up2b-exp', '[data-action="export-config"]', function(e) {
      e.preventDefault();
      exportJSON();
    });

    // Export with keys
    $(document).off('click.up2b-expk', '[data-action="export-config-keys"]').on('click.up2b-expk', '[data-action="export-config-keys"]', function(e) {
      e.preventDefault();
      exportJSONWithKeys();
    });

    // Import
    $(document).off('click.up2b-imp', '[data-action="import-config"]').on('click.up2b-imp', '[data-action="import-config"]', function(e) {
      e.preventDefault();
      importJSON();
    });

    // Bulk enable all models
    $(document).off('click.up2b-ea', '[data-action="enable-all-models"]').on('click.up2b-ea', '[data-action="enable-all-models"]', function(e) {
      e.preventDefault();
      enableAllModels($(this).data('provider'));
    });

    // Bulk disable all models
    $(document).off('click.up2b-da', '[data-action="disable-all-models"]').on('click.up2b-da', '[data-action="disable-all-models"]', function(e) {
      e.preventDefault();
      disableAllModels($(this).data('provider'));
    });

    // Reset all providers
    $(document).off('click.up2b-rap', '[data-action="reset-all-providers"]').on('click.up2b-rap', '[data-action="reset-all-providers"]', function(e) {
      e.preventDefault();
      resetAllProviders();
    });

    // Clear activity log
    $(document).off('click.up2b-cal', '[data-action="clear-activity"]').on('click.up2b-cal', '[data-action="clear-activity"]', function(e) {
      e.preventDefault();
      clearActivityLog();
    });
  }

  // ============================================================
  // SECTION 9: API EXPORTS
  // ============================================================

  window._upPart2B = {
    liveRefreshModels: liveRefreshModels,
    openLLMConfigPreview: openLLMConfigPreview,
    exportJSON: exportJSON,
    exportJSONWithKeys: exportJSONWithKeys,
    importJSON: importJSON,
    enableAllModels: enableAllModels,
    disableAllModels: disableAllModels,
    resetAllProviders: resetAllProviders,
    clearActivityLog: clearActivityLog
  };

  console.log('[UP] Part 2B loaded');
})(jQuery, Drupal);
