  // SECTION 2: LIVE MODEL REFRESH
  // ============================================================

  /**
   * Model list API endpoints by provider.
   * Not all providers expose a public model-listing endpoint.
   * For those that do, we call it and merge discovered models into the catalog.
   */
  var MODEL_LIST_ENDPOINTS = {
    'openai':      { url: 'https://api.openai.com/v1/models', method: 'bearer', parser: 'openai' },
    'groq':        { url: 'https://api.groq.com/openai/v1/models', method: 'bearer', parser: 'openai' },
    'mistral':     { url: 'https://api.mistral.ai/v1/models', method: 'bearer', parser: 'openai' },
    'together':    { url: 'https://api.together.xyz/v1/models', method: 'bearer', parser: 'openai' },
    'openrouter':  { url: 'https://openrouter.ai/api/v1/models', method: 'none', parser: 'openrouter' },
    'nvidia':      { url: 'https://integrate.api.nvidia.com/v1/models', method: 'bearer', parser: 'openai' },
    'deepseek':    { url: 'https://api.deepseek.com/models', method: 'bearer', parser: 'openai' },
    'perplexity':  { url: 'https://api.perplexity.ai/models', method: 'bearer', parser: 'openai' }
  };

  function liveRefreshModels(providerId) {
    var prov = S.providerMap[providerId];
    if (!prov || !prov.api_key || !prov.key_verified) {
      toast('Provider not configured or key not verified', 'warning');
      return;
    }

    var endpoint = MODEL_LIST_ENDPOINTS[providerId];
    if (!endpoint) {
      toast(prov.label + ' does not support live model refresh. Using catalog models.', 'info');
      return;
    }

    toast('Refreshing models for ' + prov.label + '...', 'info', 2000);

    // Disable refresh buttons for this provider
    var $refreshBtns = $('[data-action="live-refresh"][data-provider="' + providerId + '"], [data-action="live-refresh-modal"][data-provider="' + providerId + '"]');
    $refreshBtns.prop('disabled', true).addClass('up-btn-loading').html('<span class="up-spinner"></span> Refreshing...');

    var headers = { 'Content-Type': 'application/json' };
    if (endpoint.method === 'bearer') {
      headers['Authorization'] = 'Bearer ' + prov.api_key;
    }
    if (providerId === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
    }

    fetch(endpoint.url, { method: 'GET', headers: headers })
      .then(function(res) {
        if (!res.ok) throw new Error('API returned ' + res.status);
        return res.json();
      })
      .then(function(data) {
        var discovered = parseModelList(providerId, data, endpoint.parser);
        mergeDiscoveredModels(providerId, discovered);
      })
      .catch(function(err) {
        console.error('[UP] Live refresh failed for ' + providerId + ':', err);
        toast('Model refresh failed: ' + (err.message || 'Unknown error'), 'error');
        // Re-enable buttons on failure
        $refreshBtns.prop('disabled', false).removeClass('up-btn-loading').html(icon('refresh') + ' Refresh');
      });
  }

  function parseModelList(providerId, data, parser) {
    var models = [];

    if (parser === 'openai') {
      // Standard OpenAI-compatible /v1/models response
      var items = data.data || data.models || [];
      for (var i = 0; i < items.length; i++) {
        var m = items[i];
        var id = m.id || m.name || '';
        if (!id) continue;
        // Filter: skip embedding, moderation, tts, whisper, dall-e models
        var lower = id.toLowerCase();
        if (lower.indexOf('embed') > -1 || lower.indexOf('moderation') > -1 ||
            lower.indexOf('tts') > -1 || lower.indexOf('whisper') > -1 ||
            lower.indexOf('dall-e') > -1 || lower.indexOf('audio') > -1) continue;

        models.push({
          id: id,
          label: m.name || m.id || id,
          category: guessCategory(id),
          source: 'live_refresh'
        });
      }
    } else if (parser === 'openrouter') {
      // OpenRouter has a different structure
      var items2 = data.data || [];
      for (var j = 0; j < items2.length; j++) {
        var m2 = items2[j];
        models.push({
          id: m2.id || '',
          label: m2.name || m2.id || '',
          category: guessCategory(m2.id || ''),
          source: 'live_refresh'
        });
      }
    }

    return models;
  }

  function guessCategory(modelId) {
    var lower = (modelId || '').toLowerCase();
    if (lower.indexOf('405b') > -1 || lower.indexOf('opus') > -1 || lower.indexOf('pro') > -1 ||
        lower.indexOf('large') > -1 || lower.indexOf('grok-3') === 0 || lower.indexOf('r1') > -1 ||
        lower.indexOf('o3') > -1 || lower.indexOf('o1') > -1 || lower.indexOf('deep-research') > -1) {
      return 'powerful';
    }
    if (lower.indexOf('mini') > -1 || lower.indexOf('nano') > -1 || lower.indexOf('flash') > -1 ||
        lower.indexOf('lite') > -1 || lower.indexOf('8b') > -1 || lower.indexOf('small') > -1 ||
        lower.indexOf('haiku') > -1 || lower.indexOf('instant') > -1) {
      return 'fast';
    }
    return 'balanced';
  }

  function mergeDiscoveredModels(providerId, discovered) {
    var prov = S.providerMap[providerId];
    if (!prov) return;

    prov.models = prov.models || [];
    var existingIds = {};
    for (var i = 0; i < prov.models.length; i++) {
      existingIds[prov.models[i].id] = true;
    }

    var newCount = 0;
    for (var j = 0; j < discovered.length; j++) {
      var dm = discovered[j];
      if (existingIds[dm.id]) continue;
      prov.models.push({
        id: dm.id,
        label: dm.label || dm.id,
        active: false,
        is_default: false,
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
        category: dm.category || 'balanced',
        source: 'live_refresh'
      });
      newCount++;
    }

    prov.last_live_refresh = new Date().toISOString();

    if (newCount > 0) {
      logActivity('model-toggled', newCount + ' new model' + (newCount !== 1 ? 's' : '') + ' discovered for ' + prov.label + ' via API refresh');
      snapshot('Live refresh ' + prov.label);
      buildMaps();
      syncToTextarea();
      render();
      toast(newCount + ' new model' + (newCount !== 1 ? 's' : '') + ' discovered for ' + prov.label, 'success');
    } else {
      toast('No new models found for ' + prov.label + '. Catalog is up to date.', 'info');
    }
  }

  // ============================================================
