  // SECTION 8: EVENTS
  // ============================================================

  function setupPart2BEvents() {
    // Live refresh from any surface (Models view, provider editor view).
    // Both use data-action="live-refresh" — the deprecated "live-refresh-modal"
    // variant was removed when the configurator modal was replaced by the
    // full-page editor in v0.2.0.
    $(document).off('click.up2b-lr', '[data-action="live-refresh"]').on('click.up2b-lr', '[data-action="live-refresh"]', function(e) {
      e.preventDefault();
      liveRefreshModels($(this).data('provider'));
    });

    // Export
    $(document).off('click.up2b-exp', '[data-action="export-config"]').on('click.up2b-exp', '[data-action="export-config"]', function(e) {
      e.preventDefault();
      exportJSON();
    });

    // Export with keys
    $(document).off('click.up2b-expk', '[data-action="export-config-keys"]').on('click.up2b-expk', '[data-action="export-config-keys"]', function(e) {
      e.preventDefault();
      exportJSONWithKeys();
    });

    // Import
    $(document).off('click.up2b-imp', '[data-action="import-config"]').on('click.up2b-imp', '[data-action="import-config"]', function(e) {
      e.preventDefault();
      importJSON();
    });

    // Bulk enable all models
    $(document).off('click.up2b-ea', '[data-action="enable-all-models"]').on('click.up2b-ea', '[data-action="enable-all-models"]', function(e) {
      e.preventDefault();
      enableAllModels($(this).data('provider'));
    });

    // Bulk disable all models
    $(document).off('click.up2b-da', '[data-action="disable-all-models"]').on('click.up2b-da', '[data-action="disable-all-models"]', function(e) {
      e.preventDefault();
      disableAllModels($(this).data('provider'));
    });

    // Reset all providers
    $(document).off('click.up2b-rap', '[data-action="reset-all-providers"]').on('click.up2b-rap', '[data-action="reset-all-providers"]', function(e) {
      e.preventDefault();
      resetAllProviders();
    });

    // Clear activity log
    $(document).off('click.up2b-cal', '[data-action="clear-activity"]').on('click.up2b-cal', '[data-action="clear-activity"]', function(e) {
      e.preventDefault();
      clearActivityLog();
    });
  }

  // ============================================================
