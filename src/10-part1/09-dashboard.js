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
    } else {
      // Empty state
      html += '<div class="up-empty-state">';
      html += '<div class="up-empty-state-icon">' + icon('bolt') + '</div>';
      html += '<div class="up-empty-state-title">No active providers</div>';
      html += '<div class="up-empty-state-text">Configure and enable a provider to get started.</div>';
      html += '<button class="up-btn up-btn-primary" data-action="navigate" data-view="providers" style="margin-top:var(--up-space-4)">' + icon('plus') + ' Configure Provider</button>';
      html += '</div>';
    }

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

  // ============================================================
