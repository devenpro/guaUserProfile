  // SECTION 6: DATA RESET
  // ============================================================

  function resetAllProviders() {
    openConfirmDialog({
      title: 'Reset All Providers',
      message: 'This will clear all API keys, disable all models, and reset the entire configuration to defaults. This cannot be undone. Are you absolutely sure?',
      confirmLabel: 'Reset Everything',
      danger: true,
      onConfirm: function() {
        // Reset all providers
        var providers = S.data.providers || [];
        for (var i = 0; i < providers.length; i++) {
          providers[i].api_key = '';
          providers[i].key_verified = false;
          providers[i].key_verified_at = null;
          providers[i].active = false;
          providers[i].enabled = false;
          providers[i].last_live_refresh = null;
          var models = providers[i].models || [];
          for (var j = 0; j < models.length; j++) {
            models[j].active = false;
          }
        }

        S.data.default_provider = '';
        S.data.default_model = '';

        logActivity('provider-removed', 'All providers reset to defaults');
        snapshot('Reset all');
        buildMaps();
        syncToTextarea();
        render();
        toast('All providers reset', 'success');
      }
    });
  }

  function clearActivityLog() {
    openConfirmDialog({
      title: 'Clear Activity Log',
      message: 'This will permanently delete all activity log entries.',
      confirmLabel: 'Clear Log',
      danger: true,
      onConfirm: function() {
        S.data.activity = [];
        snapshot('Clear activity');
        syncToTextarea();
        render();
        toast('Activity log cleared', 'success');
      }
    });
  }

  // ============================================================
