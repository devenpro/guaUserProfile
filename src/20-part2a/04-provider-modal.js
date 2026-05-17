  // SECTION 4: PROVIDER FORM HELPERS
  // ============================================================
  //
  // Shared form-rendering helpers used by the full-page provider editor
  // (see 04b-provider-editor-view.js). Previously this file also hosted
  // openProviderModal() — a 3-step modal-based configurator — but that
  // flow was replaced by the full-page editor view in v0.2.0. The form
  // field IDs and class names below are deliberately preserved (e.g.
  // #upProviderKey, #upParamTemp, .up-mm-toggle, .up-mm-star) so the
  // shared event handlers in 08-events.js continue to work without
  // surface-specific branching.
  // ============================================================

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
