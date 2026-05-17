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
    } else if (S.configuredCount === 0) {
      // First-time empty state — show a welcome card walking the user
      // through the 4-step "configure your first provider" flow. The
      // Recommended Providers rail directly below this card gives them
      // one-click access to the top free-tier providers.
      html += renderWelcomeGuide();
    }

    // Recommended free providers rail — listed regardless of whether
    // the user already has some configured, as long as ≥1 of the
    // recommended set is still unconfigured. Gives a permanent surface
    // to add Gemini/Groq/HF/OpenRouter etc. without leaving the dash.
    html += renderRecommendedProviders();

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

  // First-time welcome guide. Shown only when S.configuredCount === 0.
  // The "Start with Gemini" CTA navigates straight to the full-page
  // editor for Gemini (the top-recommended provider). If Gemini is
  // missing for some reason (e.g., catalog edit), falls back to the
  // first available recommended provider, then to the providers view.
  function renderWelcomeGuide() {
    var firstRec = null;
    for (var i = 0; i < RECOMMENDED_ORDER.length; i++) {
      if (S.providerMap[RECOMMENDED_ORDER[i]]) { firstRec = RECOMMENDED_ORDER[i]; break; }
    }
    var ctaLabel = firstRec
      ? 'Start with ' + (MODEL_CATALOG[firstRec] ? MODEL_CATALOG[firstRec].label : firstRec)
      : 'Open Providers';

    var html = '<div class="up-welcome-card">';
    html += '<div class="up-welcome-card-icon">' + icon('sparkles') + '</div>';
    html += '<div class="up-welcome-card-body">';
    html += '<h3>Welcome — get started in 60 seconds</h3>';
    html += '<p>Configure your first AI provider to unlock model selection and start using the platform. We\'ve picked the easiest free providers for you below.</p>';
    html += '<ol class="up-welcome-steps">';
    html += '<li><strong>Pick a provider.</strong> Gemini and Groq give you free keys without a credit card.</li>';
    html += '<li><strong>Paste your API key.</strong> Each provider\'s editor links to its key page and explains where to find it.</li>';
    html += '<li><strong>Verify the key.</strong> We make a 1-token test request to confirm it works.</li>';
    html += '<li><strong>Pick your models.</strong> Toggle the models you want to expose to every app on the platform.</li>';
    html += '</ol>';
    if (firstRec) {
      html += '<button class="up-btn up-btn-primary" data-action="open-provider" data-provider="' + esc(firstRec) + '">' + icon('arrow-right') + ' ' + esc(ctaLabel) + '</button>';
    } else {
      html += '<button class="up-btn up-btn-primary" data-action="navigate" data-view="providers">' + icon('arrow-right') + ' ' + esc(ctaLabel) + '</button>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  // Recommended Providers rail. Renders a horizontal card grid of any
  // RECOMMENDED_ORDER provider the user has not yet configured (no key
  // entered yet — we keep them visible until the user has actually put
  // a key in, even if not verified). Stays visible after some providers
  // are configured, as long as ≥1 recommended provider remains untouched.
  function renderRecommendedProviders() {
    var unconfigured = [];
    for (var i = 0; i < RECOMMENDED_ORDER.length; i++) {
      var pid = RECOMMENDED_ORDER[i];
      var prov = S.providerMap[pid];
      if (!prov) continue;
      // "Unconfigured" = no API key entered yet. Once they paste a key
      // (verified or not) the rail card disappears — they can finish in
      // the editor or via the Providers view.
      if (prov.api_key && prov.api_key.length > 0) continue;
      var cat = MODEL_CATALOG[pid];
      if (!cat) continue;
      unconfigured.push({ id: pid, prov: prov, cat: cat });
    }
    if (unconfigured.length === 0) return '';

    var isFirstTime = S.configuredCount === 0;
    var titleLabel = isFirstTime ? 'Recommended free providers' : 'Add another provider';
    var subtitle = isFirstTime
      ? 'Free API keys — no credit card required. Pick one to get started.'
      : 'Free providers you haven\'t configured yet. One-click setup with built-in guidance.';

    var html = '<div class="up-section up-recommended">';
    html += '<div class="up-section-header">';
    html += '<h3>' + icon('sparkles') + ' ' + esc(titleLabel) + '</h3>';
    html += '<span class="up-section-subtitle">' + esc(subtitle) + '</span>';
    html += '</div>';

    html += '<div class="up-rec-grid">';
    for (var j = 0; j < unconfigured.length; j++) {
      var u = unconfigured[j];
      var freeNote = (u.cat.guide && u.cat.guide.free_tier) ? u.cat.guide.free_tier : '';

      html += '<div class="up-rec-card" data-action="open-provider" data-provider="' + esc(u.id) + '">';
      html += '<div class="up-rec-card-top">';
      html += '<span class="up-rec-card-icon" style="background:' + u.cat.color + '">' + icon(u.cat.icon) + '</span>';
      if (u.cat.free_tier) {
        html += '<span class="up-rec-free-pill">' + icon('check') + ' Free tier</span>';
      }
      html += '</div>';
      html += '<div class="up-rec-card-name">' + esc(u.cat.label) + '</div>';
      html += '<div class="up-rec-card-desc">' + esc(u.cat.desc) + '</div>';
      if (freeNote) {
        html += '<div class="up-rec-card-note">' + esc(truncate(freeNote, 110)) + '</div>';
      }
      html += '<div class="up-rec-card-cta">' + icon('arrow-right') + ' Configure now</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ============================================================
