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
