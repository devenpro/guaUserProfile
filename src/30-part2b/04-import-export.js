  // SECTION 4: IMPORT / EXPORT
  // ============================================================

  function exportJSON() {
    var exportData = {
      _format: 'up-data-v1',
      _app: 'user_profile',
      _version: '1.0.0',
      _exported: new Date().toISOString(),
      data: deepClone(S.data)
    };

    // Mask API keys in export for safety
    var providers = exportData.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      if (providers[i].api_key) {
        providers[i].api_key = maskKey(providers[i].api_key) + '_MASKED';
      }
    }

    var json = JSON.stringify(exportData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'user-profile-config-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logActivity('settings-changed', 'Configuration exported');
    toast('Configuration exported (API keys are masked)', 'success');
  }

  function exportJSONWithKeys() {
    openConfirmDialog({
      title: 'Export with API Keys',
      message: 'This will export your full configuration including unmasked API keys. Only do this for backup purposes. Keep the file secure.',
      confirmLabel: 'Export with Keys',
      danger: true,
      onConfirm: function() {
        var exportData = {
          _format: 'up-data-v1',
          _app: 'user_profile',
          _version: '1.0.0',
          _exported: new Date().toISOString(),
          data: deepClone(S.data)
        };

        var json = JSON.stringify(exportData, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'user-profile-config-full-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logActivity('settings-changed', 'Configuration exported with API keys');
        toast('Full configuration exported', 'success');
      }
    });
  }

  function importJSON() {
    var $input = $('<input type="file" accept=".json" style="display:none">');
    $('body').append($input);

    $input.on('change', function() {
      var file = this.files[0];
      if (!file) { $input.remove(); return; }

      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var imported = JSON.parse(e.target.result);

          // Validate format
          if (!imported._format && !imported.data) {
            toast('Invalid file format. Expected User Profile export.', 'error');
            $input.remove();
            return;
          }

          var providerCount = 0;
          var importData = imported.data || imported;
          if (importData.providers) {
            providerCount = importData.providers.filter(function(p) { return p.api_key && p.api_key.length > 0 && p.api_key.indexOf('_MASKED') === -1; }).length;
          }

          var msg = 'Import this configuration?';
          if (providerCount > 0) {
            msg += ' Found ' + providerCount + ' provider' + (providerCount !== 1 ? 's' : '') + ' with API keys.';
          } else {
            msg += ' Note: API keys appear to be masked — you may need to re-enter them after import.';
          }

          openConfirmDialog({
            title: 'Import Configuration',
            message: msg + ' Current configuration will be replaced.',
            confirmLabel: 'Import',
            danger: true,
            onConfirm: function() {
              var newData = imported.data || imported;
              // Preserve structure
              S.data = newData;
              S.data.providers = S.data.providers || [];
              S.data.default_provider = S.data.default_provider || '';
              S.data.default_model = S.data.default_model || '';
              S.data.preferences = S.data.preferences || { auto_sync_llm_config: true, timezone: 'UTC' };
              S.data.activity = S.data.activity || [];

              // Strip masked keys
              for (var i = 0; i < S.data.providers.length; i++) {
                var p = S.data.providers[i];
                if (p.api_key && p.api_key.indexOf('_MASKED') > -1) {
                  p.api_key = '';
                  p.key_verified = false;
                  p.active = false;
                }
              }

              logActivity('settings-changed', 'Configuration imported from file');
              snapshot('Import');
              buildMaps();
              syncToTextarea();
              render();
              toast('Configuration imported', 'success');
            }
          });
        } catch (err) {
          toast('Invalid JSON file: ' + (err.message || 'Parse error'), 'error');
        }
        $input.remove();
      };
      reader.readAsText(file);
    });

    $input.click();
  }

  // ============================================================
