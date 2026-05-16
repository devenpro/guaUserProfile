  // SECTION 6: PROVIDER SAVE & REMOVE
  // ============================================================

  function saveProviderFromModal(providerId) {
    var prov = S.providerMap[providerId || _verifyingProvider];
    if (!prov) { closeModal(); return; }

    // Collect model toggles
    $('.up-mm-toggle').each(function() {
      var modelId = $(this).data('model');
      var isChecked = $(this).is(':checked');
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) {
          models[i].active = isChecked;
          break;
        }
      }
    });

    // Collect default stars
    var defaultModelId = null;
    $('.up-mm-star.up-star--on').each(function() {
      defaultModelId = $(this).data('model');
    });
    if (defaultModelId) {
      var models = prov.models || [];
      for (var j = 0; j < models.length; j++) {
        models[j].is_default = (models[j].id === defaultModelId);
      }
    }

    // Collect parameters and apply to all active models
    var temp = parseFloat($('#upParamTemp').val()) / 100;
    var maxTok = parseInt($('#upParamTokens').val(), 10) || 8192;
    var topP = parseFloat($('#upParamTopP').val()) / 100;

    if (!isNaN(temp) && !isNaN(topP)) {
      var models2 = prov.models || [];
      for (var k = 0; k < models2.length; k++) {
        if (models2[k].active) {
          models2[k].temperature = Math.round(temp * 100) / 100;
          models2[k].max_tokens = maxTok;
          models2[k].top_p = Math.round(topP * 100) / 100;
        }
      }
    }

    // Update API key if changed
    var newKey = $('#upProviderKey').val().trim();
    if (newKey && newKey !== prov.api_key) {
      prov.api_key = newKey;
      // If key changed but not verified, mark unverified and disable
      if (!prov.key_verified) {
        prov.enabled = false;
        prov.active = false;
      }
    }
    // Keep active in sync with enabled
    prov.active = prov.enabled;

    // Auto-set profile default if none exists
    if (!S.data.default_provider || !S.providerMap[S.data.default_provider] || !S.providerMap[S.data.default_provider].enabled) {
      var activeModels = (prov.models || []).filter(function(m) { return m.active; });
      if (prov.enabled && prov.key_verified && activeModels.length > 0) {
        S.data.default_provider = prov.id;
        var defM = activeModels.find(function(m) { return m.is_default; }) || activeModels[0];
        S.data.default_model = defM ? defM.id : '';
        logActivity('default-changed', 'Profile default set to ' + prov.label + ' / ' + (defM ? defM.label : ''));
      }
    }

    var activeModelCount = (prov.models || []).filter(function(m) { return m.active; }).length;
    logActivity('provider-configured', prov.label + ' saved with ' + activeModelCount + ' active model' + (activeModelCount !== 1 ? 's' : ''));
    snapshot('Save ' + prov.label);
    buildMaps();
    syncToTextarea();
    closeModal();
    render();
    toast(prov.label + ' configuration saved', 'success');
  }

  function removeProvider(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    openConfirmDialog({
      title: 'Remove ' + prov.label,
      message: 'This will clear the API key and disable all models for ' + prov.label + '. Are you sure?',
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: function() {
        prov.api_key = '';
        prov.key_verified = false;
        prov.key_verified_at = null;
        prov.active = false;
        prov.enabled = false;
        var models = prov.models || [];
        for (var i = 0; i < models.length; i++) { models[i].active = false; }

        // If this was the default provider, clear default
        if (S.data.default_provider === providerId) {
          S.data.default_provider = '';
          S.data.default_model = '';
          // Auto-assign new default if another provider is exportable
          for (var j = 0; j < (S.data.providers || []).length; j++) {
            var other = S.data.providers[j];
            if (other.enabled && other.key_verified && other.id !== providerId) {
              var otherActive = (other.models || []).filter(function(m) { return m.active; });
              if (otherActive.length > 0) {
                S.data.default_provider = other.id;
                var defM = otherActive.find(function(m) { return m.is_default; }) || otherActive[0];
                S.data.default_model = defM ? defM.id : '';
                break;
              }
            }
          }
        }

        logActivity('provider-removed', prov.label + ' provider removed');
        snapshot('Remove ' + prov.label);
        buildMaps();
        syncToTextarea();
        closeModal();
        render();
        toast(prov.label + ' removed', 'success');
      }
    });
  }

  // ============================================================
