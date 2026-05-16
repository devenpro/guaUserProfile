  // SECTION 6: NAVIGATION
  // ============================================================

  function readHash() {
    var h = window.location.hash.replace('#', '');
    return APP_VIEWS[h] ? h : 'dashboard';
  }

  function navigate(viewId) {
    if (!APP_VIEWS[viewId]) viewId = 'dashboard';
    S.previousView = S.currentView;
    S.currentView = viewId;
    window.location.hash = viewId;
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
        case 'dashboard':  html = renderDashboard(); break;
        case 'providers':  html = R.providers ? R.providers() : renderProviders(); break;
        case 'models':     html = R.models ? R.models() : renderModels(); break;
        default:           html = renderDashboard(); break;
      }
      $c.html(html);

      // Call view-specific event setup if registered
      if (S.currentView === 'providers' && R.setupProvidersEvents) R.setupProvidersEvents();
      if (S.currentView === 'models' && R.setupModelsEvents) R.setupModelsEvents();
    } catch (err) {
      console.error('[UP] renderCurrentView crashed for view "' + S.currentView + '":', err);
      $c.html(renderCrashCard(S.currentView, err));
    }

    // Update nav active state (always runs, even after a crash, so the
    // sidebar reflects the requested view).
    $('.up-nav-item').removeClass('up-nav-item-active');
    $('.up-nav-item[data-view="' + S.currentView + '"]').addClass('up-nav-item-active');

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
