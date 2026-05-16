  // SECTION 8: APP SHELL
  // ============================================================

  function renderApp() {
    // Compute Drupal toolbar offset
    var toolbarHeight = 0;
    if ($('#toolbar-bar').length) toolbarHeight += $('#toolbar-bar').outerHeight() || 0;
    if ($('.toolbar-tray-horizontal.is-active').length) toolbarHeight += $('.toolbar-tray-horizontal.is-active').outerHeight() || 0;

    var initials = '';
    if (S.user.fullName) {
      var parts = S.user.fullName.split(' ');
      initials = parts[0] ? parts[0].charAt(0).toUpperCase() : '';
      if (parts.length > 1) initials += parts[parts.length - 1].charAt(0).toUpperCase();
    }
    initials = initials || 'UP';

    var html = '<div id="upApp" class="up-app" style="--up-drupal-toolbar:' + toolbarHeight + 'px">';

    // Header
    html += '<div class="up-header">';
    html += '<div class="up-header-left">';
    html += '<button class="up-btn-icon up-sidebar-toggle" data-action="toggle-sidebar">' + icon('bars') + '</button>';
    html += '<div class="up-header-avatar">' + esc(initials) + '</div>';
    html += '<div class="up-header-info">';
    html += '<span class="up-header-name">User Profile</span>';
    html += '<span class="up-header-handle">' + esc(S.user.fullName || 'User') + ' · GoUltra AI</span>';
    html += '</div></div>';
    html += '<div class="up-header-right">';
    html += '<span class="up-save-status up-saved">' + icon('check') + ' Saved</span>';
    html += '<button class="up-btn up-btn-primary up-btn-sm" data-action="save">' + icon('check') + ' Save</button>';
    html += '</div></div>';

    // Body: sidebar + main
    html += '<div class="up-body">';

    // Sidebar
    html += '<div class="up-sidebar">';
    html += '<div class="up-sidebar-overlay" data-action="toggle-sidebar"></div>';
    html += '<nav class="up-nav">';
    for (var vk in APP_VIEWS) {
      if (!APP_VIEWS.hasOwnProperty(vk)) continue;
      var v = APP_VIEWS[vk];
      var isActive = S.currentView === vk;
      html += '<div class="up-nav-item' + (isActive ? ' up-nav-item-active' : '') + '" data-action="navigate" data-view="' + vk + '">';
      html += '<span class="up-nav-icon">' + icon(v.icon) + '</span>';
      html += '<span class="up-nav-label">' + esc(v.label) + '</span>';
      if (vk === 'providers') html += '<span class="up-nav-badge up-nav-badge-providers">' + S.exportableCount + '/' + PROVIDER_ORDER.length + '</span>';
      if (vk === 'models') html += '<span class="up-nav-badge up-nav-badge-models">' + S.totalActiveModels + '</span>';
      html += '</div>';
    }
    html += '<div class="up-nav-spacer"></div>';
    html += '<div class="up-brand-strip up-brand-strip--active">' + icon('shield-check') + ' <span>GoUltra AI Platform</span></div>';
    html += '</nav></div>';

    // Main content
    html += '<div class="up-main"><div class="up-content" id="upContent"></div></div>';

    html += '</div>'; // body
    html += '<div id="upToasts" class="up-toast-container"></div>';
    html += '</div>'; // app

    // Inject into page
    var $inject = S.$textarea.closest('.layout-region-node-main, .node-form, form');
    if (!$inject.length) $inject = S.$form;
    $inject.before(html);
    $('body').addClass('up-active');

    renderCurrentView();
  }

  // ============================================================
