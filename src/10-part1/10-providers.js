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
      // Surface free-tier status so users browsing the list can spot
      // no-credit-card-required providers without opening each editor.
      if (catInfo && catInfo.free_tier) {
        html += '<span class="up-rec-free-pill" title="Free API key available without a credit card">' + icon('check') + ' Free tier</span>';
      }
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
