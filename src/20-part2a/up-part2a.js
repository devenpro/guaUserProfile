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
