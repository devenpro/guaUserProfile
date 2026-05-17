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

    // Strip providers that have been retired from the catalog (v0.2.0:
    // claude — direct Anthropic API is browser-hostile). This IS a
    // platform-wide breaking change: any consumer app reading
    // field_llm_config for the stripped provider id will see it
    // disappear on next save. The user explicitly opted in to this when
    // adding provider-guide support.
    var keptProviders = [];
    for (var rmi = 0; rmi < d.providers.length; rmi++) {
      var rp = d.providers[rmi];
      if (REMOVED_PROVIDERS && REMOVED_PROVIDERS[rp.id]) {
        // Log the removal so the activity feed shows it; the user (and
        // any auditor) can trace exactly when the entry vanished.
        d.activity.push({
          id: 'act_migrate_' + rp.id + '_' + Date.now().toString(36),
          type: 'provider-removed',
          description: rp.label + ' provider retired from catalog: ' + REMOVED_PROVIDERS[rp.id],
          timestamp: new Date().toISOString(),
          user_id: S.user.id || '',
          user_name: S.user.fullName || S.user.name || ''
        });
        // If the retired provider was the profile default, clear it —
        // the auto-assign step below will pick a new default on next save.
        if (d.default_provider === rp.id) {
          d.default_provider = '';
          d.default_model = '';
        }
        console.warn('[UP] Stripped retired provider "' + rp.id + '" from user data.');
        continue;
      }
      keptProviders.push(rp);
    }
    d.providers = keptProviders;

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
