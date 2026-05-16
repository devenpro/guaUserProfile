  // SECTION 4: MAP BUILDERS
  // ============================================================

  function buildMaps() {
    S.providerMap = {};
    S.activeProviders = [];
    S.configuredCount = 0;
    S.verifiedCount = 0;
    S.enabledCount = 0;
    S.exportableCount = 0;
    S.totalActiveModels = 0;

    var providers = S.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      S.providerMap[p.id] = p;

      // Has an API key entered
      if (p.api_key && p.api_key.length > 0) S.configuredCount++;

      // Key has been verified
      if (p.key_verified) S.verifiedCount++;

      // User has enabled this provider (toggle on)
      if (p.enabled) S.enabledCount++;

      // Exportable: key verified + enabled + has active models
      if (p.key_verified && p.enabled) {
        var activeModels = (p.models || []).filter(function(m) { return m.active; });
        if (activeModels.length > 0) {
          S.activeProviders.push(p);
          S.exportableCount++;
          S.totalActiveModels += activeModels.length;
        }
      }
    }
  }

  // ============================================================
