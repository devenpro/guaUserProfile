  // SECTION 5: BULK MODEL OPERATIONS
  // ============================================================

  function enableAllModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov || !prov.key_verified) return;

    var models = prov.models || [];
    var changed = 0;
    for (var i = 0; i < models.length; i++) {
      if (!models[i].active) {
        models[i].active = true;
        changed++;
      }
    }

    if (changed > 0) {
      logActivity('model-toggled', 'Enabled all ' + models.length + ' models for ' + prov.label);
      snapshot('Enable all models');
      buildMaps();
      syncToTextarea();
      render();
      toast('All models enabled for ' + prov.label, 'success');
    } else {
      toast('All models already enabled', 'info');
    }
  }

  function disableAllModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    var models = prov.models || [];
    var changed = 0;
    for (var i = 0; i < models.length; i++) {
      if (models[i].active) {
        models[i].active = false;
        changed++;
      }
    }

    if (changed > 0) {
      logActivity('model-toggled', 'Disabled all models for ' + prov.label);
      snapshot('Disable all models');
      buildMaps();
      syncToTextarea();
      render();
      toast('All models disabled for ' + prov.label, 'success');
    } else {
      toast('All models already disabled', 'info');
    }
  }

  // ============================================================
