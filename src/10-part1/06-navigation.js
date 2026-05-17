  // SECTION 6: NAVIGATION
  // ============================================================

  // Hash format:
  //   #dashboard, #providers, #models  → top-level views in APP_VIEWS
  //   #provider/<id>                    → full-page provider editor (parameterised)
  //   anything else                     → falls back to #dashboard
  function readHash() {
    var h = window.location.hash.replace('#', '');
    if (APP_VIEWS[h]) return h;
    if (h.indexOf(PROVIDER_EDITOR_HASH_PREFIX) === 0 && h.length > PROVIDER_EDITOR_HASH_PREFIX.length) {
      var id = h.slice(PROVIDER_EDITOR_HASH_PREFIX.length);
      if (S.providerMap && S.providerMap[id]) return h;
    }
    return 'dashboard';
  }

  // Accepts either a top-level view id ('dashboard'|'providers'|'models')
  // or a parameterised editor route ('provider/<id>'). Anything else falls
  // back to the dashboard.
  function navigate(target) {
    var view = 'dashboard';
    var providerId = null;
    var hashOut = 'dashboard';

    if (APP_VIEWS[target]) {
      view = target;
      hashOut = target;
    } else if (target && target.indexOf(PROVIDER_EDITOR_HASH_PREFIX) === 0) {
      var id = target.slice(PROVIDER_EDITOR_HASH_PREFIX.length);
      if (id && S.providerMap && S.providerMap[id]) {
        view = 'provider-editor';
        providerId = id;
        hashOut = target;
      }
    }

    S.previousView = S.currentView;
    S.currentView = view;
    S.editingProviderId = providerId;
    window.location.hash = hashOut;
    renderCurrentView();
  }

  function renderCurrentView() {
    var $c = $('#upContent');
    if (!$c.length) return;

    var R = window._upRenderers;
    var html = '';

    // Error boundary: any throw inside a view renderer is caught here and
    // replaced with a visible crash card. Without this, an exception leaves
    // #upContent blank with no on-screen signal — silent failure mode that
    // is especially dangerous for a producer app whose output is consumed
    // by every other app on the platform.
    try {
      switch (S.currentView) {
        case 'dashboard':       html = renderDashboard(); break;
        case 'providers':       html = R.providers ? R.providers() : renderProviders(); break;
        case 'models':          html = R.models ? R.models() : renderModels(); break;
        case 'provider-editor':
          if (R.providerEditor && S.editingProviderId) {
            html = R.providerEditor(S.editingProviderId);
          } else {
            // Part 2A hasn't loaded yet (or no provider id) — show a
            // loading shim so the page is not blank.
            html = '<div class="up-empty-state"><div class="up-empty-state-icon">' + icon('clock') + '</div><div class="up-empty-state-title">Loading editor…</div><div class="up-empty-state-text">If this persists, refresh the page.</div></div>';
          }
          break;
        default:                html = renderDashboard(); break;
      }
      $c.html(html);

      // Call view-specific event setup if registered
      if (S.currentView === 'providers' && R.setupProvidersEvents) R.setupProvidersEvents();
      if (S.currentView === 'models' && R.setupModelsEvents) R.setupModelsEvents();
      if (S.currentView === 'provider-editor' && R.setupProviderEditorEvents) R.setupProviderEditorEvents();
    } catch (err) {
      console.error('[UP] renderCurrentView crashed for view "' + S.currentView + '":', err);
      $c.html(renderCrashCard(S.currentView, err));
    }

    // Update nav active state (always runs, even after a crash, so the
    // sidebar reflects the requested view). The provider-editor sub-route
    // highlights the Providers item so users have a "where am I" cue.
    $('.up-nav-item').removeClass('up-nav-item-active');
    var navHighlight = S.currentView === 'provider-editor' ? 'providers' : S.currentView;
    $('.up-nav-item[data-view="' + navHighlight + '"]').addClass('up-nav-item-active');

    // Update nav badges (defensively wrapped — counts may be stale if a
    // render path crashed mid-update, but the badges should still refresh
    // safely from S on the next successful render).
    try {
      $('.up-nav-badge-providers').text(S.exportableCount + '/' + PROVIDER_ORDER.length);
      $('.up-nav-badge-models').text(S.totalActiveModels);
    } catch (e) { /* swallow — badges are cosmetic */ }
  }

  function renderCrashCard(viewName, err) {
    var msg = (err && err.message) ? err.message : String(err);
    var stack = (err && err.stack) ? err.stack : '(no stack available)';
    return '<div class="up-crash-card" role="alert">' +
      '<div class="up-crash-card-icon">' + icon('triangle-exclamation') + '</div>' +
      '<h3 class="up-crash-card-title">View "' + esc(viewName) + '" failed to render</h3>' +
      '<p class="up-crash-card-msg">' + esc(msg) + '</p>' +
      '<details class="up-crash-card-stack"><summary>Stack trace</summary><pre>' + esc(stack) + '</pre></details>' +
      '<p class="up-crash-card-action">Try switching views, or refresh the page. Share the stack trace with the dev.</p>' +
    '</div>';
  }

  // ============================================================
