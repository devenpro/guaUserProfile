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
