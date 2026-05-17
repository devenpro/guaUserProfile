  // SECTION 12: EVENT HANDLERS
  // ============================================================

  function setupEventHandlers() {
    // Navigation
    $(document).off('click.up-nav', '[data-action="navigate"]').on('click.up-nav', '[data-action="navigate"]', function(e) {
      e.preventDefault();
      navigate($(this).data('view'));
    });

    // Sidebar toggle
    $(document).off('click.up-sidebar', '[data-action="toggle-sidebar"]').on('click.up-sidebar', '[data-action="toggle-sidebar"]', function(e) {
      e.preventDefault();
      $('#upApp').toggleClass('up-app--sidebar-hidden');
    });

    // Save button
    $(document).off('click.up-save', '[data-action="save"]').on('click.up-save', '[data-action="save"]', function(e) {
      e.preventDefault();
      syncToTextarea();
      updateSaveStatus('saving');
      setTimeout(function() {
        if (S.$submitBtn && S.$submitBtn.length) S.$submitBtn.click();
      }, 100);
    });

    // Provider filter pills
    $(document).off('click.up-pf', '[data-action="provider-filter"]').on('click.up-pf', '[data-action="provider-filter"]', function(e) {
      e.preventDefault();
      S.providerFilter = $(this).data('filter') || 'all';
      renderCurrentView();
    });

    // Toggle provider enabled/disabled (quick switch without opening modal)
    $(document).off('click.up-tpe', '[data-action="toggle-provider-enabled"]').on('click.up-tpe', '[data-action="toggle-provider-enabled"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      prov.enabled = !prov.enabled;
      logActivity(prov.enabled ? 'provider-configured' : 'provider-removed',
        prov.label + ' ' + (prov.enabled ? 'enabled' : 'disabled'));
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast(prov.label + (prov.enabled ? ' enabled' : ' disabled'), 'success');
    });

    // Open the full-page provider editor at #provider/<id>. The route is
    // recognised by readHash + navigate (06-navigation.js) and dispatched
    // to R.providerEditor (registered by Part 2A). If Part 2A hasn't loaded
    // yet the navigation still happens — renderCurrentView shows a
    // loading shim until Part 2A's re-render kicks in.
    $(document).off('click.up-op', '[data-action="open-provider"]').on('click.up-op', '[data-action="open-provider"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider');
      if (!providerId) return;
      navigate(PROVIDER_EDITOR_HASH_PREFIX + providerId);
    });

    // Add custom provider (Part 2A will handle the modal)
    $(document).off('click.up-acp', '[data-action="add-custom-provider"]').on('click.up-acp', '[data-action="add-custom-provider"]', function(e) {
      e.preventDefault();
      var R = window._upRenderers;
      if (R.openAddCustomProviderModal) {
        R.openAddCustomProviderModal();
      } else {
        toast('Custom provider feature loading...', 'info');
      }
    });

    // Model search (debounced)
    $(document).off('input.up-ms', '.up-model-search-input').on('input.up-ms', '.up-model-search-input', debounce(function() {
      var cursorPos = this.selectionStart;
      S.modelSearch = $(this).val() || '';
      renderCurrentView();
      // Restore focus and cursor position after re-render
      var $newInput = $('.up-model-search-input');
      if ($newInput.length) {
        $newInput.focus();
        try { $newInput[0].setSelectionRange(cursorPos, cursorPos); } catch (e) {}
      }
    }, 300));

    // Toggle model on/off
    $(document).off('click.up-tm', '[data-action="toggle-model"]').on('click.up-tm', '[data-action="toggle-model"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var modelId = $(this).data('model');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) {
          models[i].active = !models[i].active;
          logActivity('model-toggled', (models[i].active ? 'Enabled' : 'Disabled') + ': ' + models[i].label + ' (' + prov.label + ')');
          break;
        }
      }
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast((models.find(function(m) { return m.id === modelId; }) || {}).active ? 'Model enabled' : 'Model disabled', 'success');
    });

    // Set model as provider default
    $(document).off('click.up-smd', '[data-action="set-model-default"]').on('click.up-smd', '[data-action="set-model-default"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var providerId = $(this).data('provider');
      var modelId = $(this).data('model');
      var prov = S.providerMap[providerId];
      if (!prov) return;
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        models[i].is_default = (models[i].id === modelId);
      }
      logActivity('default-changed', 'Default model for ' + prov.label + ' set to ' + modelId);
      buildMaps();
      syncToTextarea();
      renderCurrentView();
      toast('Default updated', 'success');
    });

    // Activity expand/collapse
    $(document).off('click.up-ta', '[data-action="toggle-activity"]').on('click.up-ta', '[data-action="toggle-activity"]', function(e) {
      e.preventDefault();
      S.activityExpanded = !S.activityExpanded;
      renderCurrentView();
    });

    // Toast close
    $(document).off('click.up-tc', '.up-toast-close').on('click.up-tc', '.up-toast-close', function() {
      $(this).closest('.up-toast').removeClass('up-toast-show');
      var $t = $(this).closest('.up-toast');
      setTimeout(function() { $t.remove(); }, 300);
    });

    // Hash change. readHash() returns either a top-level view id or the
    // parameterised "provider/<id>" route. Reconstruct what the hash
    // *should* be from the current internal state so we don't re-navigate
    // when the URL already matches (which would cause an extra render).
    $(window).off('hashchange.up').on('hashchange.up', function() {
      var h = readHash();
      var currentRouteHash = (S.currentView === 'provider-editor' && S.editingProviderId)
        ? PROVIDER_EDITOR_HASH_PREFIX + S.editingProviderId
        : S.currentView;
      if (h !== currentRouteHash) navigate(h);
    });
  }

  // ============================================================
