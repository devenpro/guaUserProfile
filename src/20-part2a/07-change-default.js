  // SECTION 7: CHANGE DEFAULT MODAL
  // ============================================================

  function openChangeDefaultModal() {
    var html = '<div class="up-editor-form">';
    html += '<div class="up-form-group"><label>Default Provider</label>';
    html += '<select class="up-select" id="upDefaultProvider">';
    html += '<option value="">— Select —</option>';

    var providers = S.data.providers || [];
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      if (!p.enabled || !p.key_verified) continue;
      var activeModels = (p.models || []).filter(function(m) { return m.active; });
      if (activeModels.length === 0) continue;
      html += '<option value="' + esc(p.id) + '"' + (S.data.default_provider === p.id ? ' selected' : '') + '>' + esc(p.label) + ' (' + activeModels.length + ' models)</option>';
    }
    html += '</select></div>';

    // Model select (populated dynamically)
    html += '<div class="up-form-group"><label>Default Model</label>';
    html += '<select class="up-select" id="upDefaultModel">';
    if (S.data.default_provider && S.providerMap[S.data.default_provider]) {
      var curProv = S.providerMap[S.data.default_provider];
      var curModels = (curProv.models || []).filter(function(m) { return m.active; });
      for (var j = 0; j < curModels.length; j++) {
        html += '<option value="' + esc(curModels[j].id) + '"' + (S.data.default_model === curModels[j].id ? ' selected' : '') + '>' + esc(curModels[j].label) + '</option>';
      }
    }
    html += '</select></div>';
    html += '</div>';

    openModal('Change Profile Default', html, {
      size: 'sm',
      saveLabel: 'Set Default',
      onSave: function() { saveDefaultFromModal(); }
    });
  }

  function saveDefaultFromModal() {
    var providerId = $('#upDefaultProvider').val();
    var modelId = $('#upDefaultModel').val();

    if (!providerId || !modelId) { toast('Select a provider and model', 'warning'); return; }

    S.data.default_provider = providerId;
    S.data.default_model = modelId;

    var prov = S.providerMap[providerId];
    var modelLabel = modelId;
    if (prov) {
      var models = prov.models || [];
      for (var i = 0; i < models.length; i++) {
        if (models[i].id === modelId) { modelLabel = models[i].label; break; }
      }
    }

    logActivity('default-changed', 'Profile default set to ' + (prov ? prov.label : providerId) + ' / ' + modelLabel);
    snapshot('Change default');
    buildMaps();
    syncToTextarea();
    closeModal();
    render();
    toast('Profile default updated', 'success');
  }

  // ============================================================
  // SECTION 7B: ADD CUSTOM PROVIDER MODAL
  // ============================================================

  function openAddCustomProviderModal() {
    var html = '<div class="up-editor-form">';

    html += '<div class="up-alert up-alert--info" style="margin-bottom:var(--up-space-4)">';
    html += icon('info') + ' Add a provider not in our catalog. We\'ll auto-detect the auth method when you verify the key.';
    html += '</div>';

    html += '<div class="up-form-group"><label>Provider Name <span class="up-required">*</span></label>';
    html += '<input type="text" class="up-input" id="upCustomName" placeholder="e.g. MyProvider AI">';
    html += '</div>';

    html += '<div class="up-form-group"><label>Provider ID <span class="up-required">*</span></label>';
    html += '<input type="text" class="up-input" id="upCustomId" placeholder="e.g. myprovider (lowercase, no spaces)">';
    html += '<span class="up-form-hint">Unique identifier — lowercase, no spaces. Used internally.</span>';
    html += '</div>';

    html += '<div class="up-form-group"><label>API Endpoint URL <span class="up-required">*</span></label>';
    html += '<input type="url" class="up-input" id="upCustomEndpoint" placeholder="https://api.example.com/v1/chat/completions">';
    html += '<span class="up-form-hint">The chat completions endpoint. Most OpenAI-compatible APIs use <code>/v1/chat/completions</code></span>';
    html += '</div>';

    html += '<div class="up-form-group"><label>API Key <span class="up-required">*</span></label>';
    html += '<input type="password" class="up-input up-key-input" id="upCustomKey" placeholder="Enter API key">';
    html += '</div>';

    html += '</div>';

    openModal(icon('plus') + ' Add Custom Provider', html, {
      size: 'md',
      saveLabel: 'Add & Verify',
      onSave: function() { saveCustomProvider(); }
    });

    // Auto-generate ID from name
    $(document).off('input.up2a-cname', '#upCustomName').on('input.up2a-cname', '#upCustomName', function() {
      var name = $(this).val().trim();
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var $idField = $('#upCustomId');
      if (!$idField.data('manual')) {
        $idField.val(id);
      }
    });
    $(document).off('input.up2a-cid', '#upCustomId').on('input.up2a-cid', '#upCustomId', function() {
      $(this).data('manual', true);
    });
  }

  function saveCustomProvider() {
    var name = $('#upCustomName').val().trim();
    var id = $('#upCustomId').val().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    var endpoint = $('#upCustomEndpoint').val().trim();
    var key = $('#upCustomKey').val().trim();

    // Validate
    if (!name) { toast('Provider name is required', 'warning'); return; }
    if (!id) { toast('Provider ID is required', 'warning'); return; }
    if (!endpoint) { toast('API endpoint URL is required', 'warning'); return; }
    if (!key) { toast('API key is required', 'warning'); return; }

    // Check for duplicate ID
    if (S.providerMap[id]) {
      toast('A provider with ID "' + id + '" already exists', 'error');
      return;
    }

    // Validate URL
    try { new URL(endpoint); } catch (e) {
      toast('Invalid URL format', 'warning');
      return;
    }

    // Create provider entry
    var newProvider = {
      id: id,
      label: name,
      active: false,
      enabled: false,
      api_key: key,
      key_verified: false,
      key_verified_at: null,
      category: 'custom',
      models: [],
      last_live_refresh: null,
      custom: true,
      test_endpoint: endpoint,
      test_method: 'openai',
      color: generateCustomColor(id)
    };

    S.data.providers.push(newProvider);
    logActivity('provider-configured', 'Custom provider "' + name + '" added');
    snapshot('Add custom ' + name);
    buildMaps();
    syncToTextarea();
    closeModal();

    // Immediately try to verify
    toast('Provider added — verifying key...', 'info', 2000);
    setTimeout(function() {
      quickTestConnection(id, function(success) {
        if (success) {
          // On success, auto-enable and open config modal
          var prov = S.providerMap[id];
          if (prov) {
            prov.enabled = true;
            prov.active = true;
            buildMaps();
            syncToTextarea();
          }
          render();
          toast(name + ' verified and enabled! Add models via Manage.', 'success');
        } else {
          render();
          toast(name + ' added but key verification failed. Open Manage to re-enter key.', 'warning');
        }
      });
    }, 300);
  }

  function generateCustomColor(id) {
    // Generate a consistent color from provider ID string
    var hash = 0;
    for (var i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
    var hue = Math.abs(hash % 360);
    return 'hsl(' + hue + ', 55%, 45%)';
  }

  // ============================================================
