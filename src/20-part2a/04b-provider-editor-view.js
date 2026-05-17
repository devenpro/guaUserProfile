  // SECTION 4B: PROVIDER EDITOR VIEW (full-page)
  // ============================================================
  //
  // Replaces the old modal-based provider configurator with a dedicated
  // hash-routed view at #provider/<id>. Rendered by Part 1's
  // renderCurrentView() when S.currentView === 'provider-editor'.
  //
  // Layout (two columns on desktop, stacked on mobile):
  //   ┌─────────────────────────────┬──────────────────────┐
  //   │  Header: back / icon / name / status                │
  //   ├─────────────────────────────┼──────────────────────┤
  //   │  Left: Key → Models → Params│  Right: Guide panel  │
  //   │  Sticky save bar at bottom  │  (signup, steps, etc)│
  //   └─────────────────────────────┴──────────────────────┘
  //
  // The form field IDs (#upProviderKey, #upParamTemp, etc.) and class
  // names (.up-mm-toggle, .up-mm-star) are deliberately the SAME ones
  // the old modal used so the existing event handlers in 08-events.js
  // continue to work unchanged.
  // ============================================================

  function renderProviderEditor(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) {
      return '<div class="up-empty-state">' +
        '<div class="up-empty-state-icon">' + icon('triangle-exclamation') + '</div>' +
        '<div class="up-empty-state-title">Provider not found</div>' +
        '<div class="up-empty-state-text">"' + esc(providerId) + '" is not in the catalog.</div>' +
        '<button class="up-btn up-btn-primary" data-action="navigate" data-view="providers" style="margin-top:var(--up-space-4)">' + icon('arrow-left') + ' Back to Providers</button>' +
        '</div>';
    }

    // Build catInfo — from catalog or synthesised from custom provider data
    var catInfo = Constants.MODEL_CATALOG[providerId];
    var isCustom = !catInfo;
    if (!catInfo) {
      catInfo = {
        label: prov.label || providerId,
        icon: 'sparkles',
        category: prov.category || 'custom',
        desc: prov.custom ? 'Custom provider' : '',
        color: prov.color || '#6b7280',
        test_endpoint: prov.test_endpoint || '',
        test_method: prov.test_method || 'openai',
        free_tier: false,
        guide: null,
        models: (prov.models || []).map(function(m) {
          return { id: m.id, label: m.label, category: m.category || 'balanced', default_temp: m.temperature || 0.7, max_tokens: m.max_tokens || 8192 };
        })
      };
    }

    var isVerified = !!(prov.key_verified && prov.api_key);
    var activeCount = (prov.models || []).filter(function(m) { return m.active; }).length;

    var html = '<div class="up-view up-view-editor">';

    // ── Header bar ──
    html += '<div class="up-editor-topbar">';
    html += '<button class="up-btn up-btn-outline up-btn-sm" data-action="editor-back">' + icon('arrow-left') + ' Back</button>';
    html += '<div class="up-editor-titlewrap">';
    html += '<span class="up-editor-titleicon" style="background:' + catInfo.color + '">' + icon(catInfo.icon) + '</span>';
    html += '<div class="up-editor-titletext">';
    html += '<h2>' + esc(catInfo.label) + '</h2>';
    html += '<span class="up-editor-titlesub">' + esc(catInfo.desc) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="up-editor-status">';
    if (isVerified) {
      html += '<span class="up-step-badge up-step-badge--success">' + icon('shield-check') + ' Verified</span>';
      if (prov.enabled) {
        html += '<span class="up-status-on">' + icon('circle-dot') + ' ' + activeCount + ' active model' + (activeCount !== 1 ? 's' : '') + '</span>';
      } else {
        html += '<span class="up-status-off">' + icon('pause') + ' Disabled</span>';
      }
    } else if (prov.api_key) {
      html += '<span class="up-step-badge up-step-badge--warning">' + icon('triangle-exclamation') + ' Not verified</span>';
    } else if (catInfo.free_tier) {
      html += '<span class="up-rec-free-pill">' + icon('check') + ' Free tier</span>';
    }
    html += '</div>';
    html += '</div>';

    // ── Two-column body ──
    html += '<div class="up-editor-body">';

    // LEFT: Configuration form
    html += '<div class="up-editor-form-col">';

    // Step 1: API Key + Verify
    html += '<div class="up-editor-section">';
    html += '<div class="up-editor-section-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--done' : 'up-step-num--active') + '">' + (isVerified ? icon('check') : '1') + '</span>';
    html += '<h3>API Key</h3>';
    if (catInfo.guide && catInfo.guide.key_url) {
      html += '<a href="' + esc(catInfo.guide.key_url) + '" target="_blank" rel="noopener" class="up-editor-keylink">' + icon('link') + ' Get key from ' + esc(catInfo.label) + '</a>';
    }
    html += '</div>';
    html += '<div class="up-editor-section-body">';
    html += '<div class="up-key-row">';
    html += '<input type="text" class="up-input up-key-input" id="upProviderKey" placeholder="Paste your ' + esc(catInfo.label) + ' API key here" value="' + esc(prov.api_key || '') + '" autocomplete="off" spellcheck="false">';
    html += '<button class="up-btn ' + (isVerified ? 'up-btn-success' : 'up-btn-primary') + '" id="upVerifyBtn" data-action="verify-key" data-provider="' + esc(prov.id) + '">';
    html += isVerified ? icon('check') + ' Verified' : icon('shield-check') + ' Verify Key';
    html += '</button>';
    html += '</div>';
    html += '<div id="upVerifyStatus"></div>';
    if (catInfo.guide && catInfo.guide.key_format) {
      html += '<div class="up-key-meta">' + icon('info') + ' ' + esc(catInfo.guide.key_format) + '</div>';
    }
    if (prov.key_verified_at) {
      html += '<div class="up-key-meta">' + icon('clock') + ' Last verified: ' + formatRelativeTime(prov.key_verified_at) + '</div>';
    }
    html += '</div>';
    html += '</div>';

    // Step 2: Model selection (only when verified)
    html += '<div class="up-editor-section' + (isVerified ? '' : ' up-editor-section--locked') + '">';
    html += '<div class="up-editor-section-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--active' : '') + '">2</span>';
    html += '<h3>Select Models</h3>';
    if (!isVerified) {
      html += '<span class="up-step-lock">' + icon('lock') + ' Verify key first</span>';
    } else {
      html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="live-refresh" data-provider="' + esc(prov.id) + '">' + icon('refresh') + ' Refresh from API</button>';
    }
    html += '</div>';
    if (isVerified) {
      html += '<div class="up-editor-section-body">';
      html += renderModelSelectionList(prov, catInfo);
      if (isCustom) {
        html += '<div class="up-custom-model-add" style="margin-top:var(--up-space-3)">';
        html += '<span class="up-form-hint">' + icon('info') + ' Custom providers: use "Refresh from API" to discover models, or add them manually via the Models view after saving.</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Step 3: Default parameters
    html += '<div class="up-editor-section' + (isVerified ? '' : ' up-editor-section--locked') + '">';
    html += '<div class="up-editor-section-header">';
    html += '<span class="up-step-num ' + (isVerified ? 'up-step-num--active' : '') + '">3</span>';
    html += '<h3>Default Parameters</h3>';
    if (!isVerified) html += '<span class="up-step-lock">' + icon('lock') + ' Verify key first</span>';
    html += '</div>';
    if (isVerified) {
      html += '<div class="up-editor-section-body">';
      html += renderParameterControls(prov);
      html += '<div class="up-form-hint" style="margin-top:var(--up-space-3)">' + icon('info') + ' These defaults apply to every active model. Override per-model in the Models view.</div>';
      html += '</div>';
    }
    html += '</div>';

    // Sticky action bar at the bottom of the left column
    html += '<div class="up-editor-actions">';
    if (isVerified && prov.api_key) {
      html += '<button class="up-btn up-btn-danger up-btn-sm" data-action="remove-provider" data-provider="' + esc(prov.id) + '">' + icon('trash') + ' Remove Provider</button>';
    } else {
      html += '<span></span>';
    }
    html += '<div class="up-editor-actions-right">';
    html += '<button class="up-btn up-btn-outline" data-action="editor-back">Cancel</button>';
    html += '<button class="up-btn up-btn-primary" data-action="editor-save" data-provider="' + esc(prov.id) + '"' + (isVerified ? '' : ' disabled title="Verify the API key first"') + '>' + icon('check') + ' Save Provider</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // form-col

    // RIGHT: Guide panel
    html += '<div class="up-editor-guide-col">';
    html += renderProviderGuide(prov, catInfo);
    html += '</div>';

    html += '</div>'; // body
    html += '</div>'; // view
    return html;
  }

  function renderProviderGuide(prov, catInfo) {
    var guide = catInfo.guide;

    if (!guide) {
      // Custom provider — no built-in guide. Show a tiny info card
      // pointing them at the test endpoint.
      var html0 = '<div class="up-guide-card">';
      html0 += '<h4>' + icon('info') + ' Custom provider</h4>';
      html0 += '<p>This is a custom provider you added. We don\'t have a built-in setup guide, but you can verify connectivity using the API key from your provider\'s dashboard.</p>';
      if (prov.test_endpoint) {
        html0 += '<p class="up-guide-endpoint"><strong>Test endpoint:</strong><br><code>' + esc(prov.test_endpoint) + '</code></p>';
      }
      html0 += '</div>';
      return html0;
    }

    var html = '';

    // Quick-actions card (signup + key URL + free tier note)
    html += '<div class="up-guide-card up-guide-card--actions">';
    html += '<h4>' + icon('lightbulb') + ' Quick start</h4>';
    if (guide.signup_url) {
      html += '<a class="up-btn up-btn-outline up-btn-sm" href="' + esc(guide.signup_url) + '" target="_blank" rel="noopener">' + icon('user') + ' Sign up at ' + esc(catInfo.label) + '</a>';
    }
    if (guide.key_url) {
      html += '<a class="up-btn up-btn-outline up-btn-sm" href="' + esc(guide.key_url) + '" target="_blank" rel="noopener">' + icon('key') + ' Open API keys page</a>';
    }
    if (guide.free_tier) {
      html += '<div class="up-guide-freetier">';
      html += '<strong>' + icon(catInfo.free_tier ? 'check-circle' : 'info') + ' ' + (catInfo.free_tier ? 'Free tier' : 'Pricing') + '</strong>';
      html += '<p>' + esc(guide.free_tier) + '</p>';
      html += '</div>';
    }
    html += '</div>';

    // Steps
    if (guide.steps && guide.steps.length) {
      html += '<div class="up-guide-card">';
      html += '<h4>' + icon('layer-group') + ' Setup steps</h4>';
      html += '<ol class="up-guide-steps">';
      for (var i = 0; i < guide.steps.length; i++) {
        var s = guide.steps[i];
        html += '<li><strong>' + esc(s.title) + '</strong><span>' + esc(s.body) + '</span></li>';
      }
      html += '</ol>';
      html += '</div>';
    }

    // Troubleshooting
    if (guide.troubleshooting && guide.troubleshooting.length) {
      html += '<div class="up-guide-card">';
      html += '<h4>' + icon('triangle-exclamation') + ' Troubleshooting</h4>';
      html += '<dl class="up-guide-trouble">';
      for (var j = 0; j < guide.troubleshooting.length; j++) {
        var t = guide.troubleshooting[j];
        html += '<dt>' + esc(t.issue) + '</dt>';
        html += '<dd>' + esc(t.fix) + '</dd>';
      }
      html += '</dl>';
      html += '</div>';
    }

    return html;
  }

  function setupProviderEditorEvents() {
    // Back button — returns to whichever view brought the user to the
    // editor. Falls back to Providers list if previousView is unset.
    $(document).off('click.up2a-eb', '[data-action="editor-back"]').on('click.up2a-eb', '[data-action="editor-back"]', function(e) {
      e.preventDefault();
      var back = S.previousView || 'providers';
      if (back === 'provider-editor') back = 'providers';
      navigate(back);
    });

    // Save button — collects form values via saveProviderFromEditor.
    $(document).off('click.up2a-es', '[data-action="editor-save"]').on('click.up2a-es', '[data-action="editor-save"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider') || S.editingProviderId;
      saveProviderFromEditor(providerId);
    });
  }

  // ============================================================
