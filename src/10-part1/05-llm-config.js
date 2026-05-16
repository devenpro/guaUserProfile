  // SECTION 5: LLM CONFIG BUILDER
  // ============================================================

  function buildLLMConfig() {
    var config = { providers: [], default_provider: S.data.default_provider || '', default_model: S.data.default_model || '' };
    var providers = S.data.providers || [];

    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      if (!p.enabled || !p.key_verified || !p.api_key) continue;

      var activeModels = [];
      var pModels = p.models || [];
      for (var m = 0; m < pModels.length; m++) {
        var mod = pModels[m];
        if (!mod.active) continue;
        activeModels.push({
          id: mod.id,
          label: mod.label,
          active: true,
          is_default: !!mod.is_default,
          temperature: mod.temperature !== undefined ? mod.temperature : 0.7,
          max_tokens: mod.max_tokens || 8192,
          top_p: mod.top_p !== undefined ? mod.top_p : 0.95
        });
      }
      if (activeModels.length === 0) continue;

      config.providers.push({
        id: p.id,
        label: p.label,
        active: true,
        api_key: p.api_key,
        models: activeModels
      });
    }

    return config;
  }

  // ============================================================
