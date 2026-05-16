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
