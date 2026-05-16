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
