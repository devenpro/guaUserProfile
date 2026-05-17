  // SECTION 2: STATE OBJECT
  // ============================================================

  var S = {
    data: {
      providers: [],
      default_provider: '',
      default_model: '',
      preferences: { auto_sync_llm_config: true, timezone: 'UTC' },
      activity: []
    },
    user: { id: '', name: '', email: '', fullName: '', timezone: '', roles: '' },
    // Lookup maps (rebuilt by buildMaps)
    providerMap: {},
    activeProviders: [],       // Providers that are: key_verified + enabled + have active models
    configuredCount: 0,        // Providers with an API key entered
    verifiedCount: 0,          // Providers with key_verified = true
    enabledCount: 0,           // Providers with enabled = true (user toggle)
    exportableCount: 0,        // Providers eligible for LLM config export (verified + enabled + active models)
    totalActiveModels: 0,      // Sum of active models across exportable providers
    // UI state
    currentView: 'dashboard',
    previousView: null,
    editingProviderId: null,    // Set when currentView === 'provider-editor' (hash #provider/<id>)
    providerFilter: 'all',
    modelSearch: '',
    activityExpanded: false,
    // Drupal refs
    $textarea: null,
    $llmConfigTextarea: null,
    $form: null,
    $submitBtn: null,
    _initializing: false,
    initialized: false,
    dirty: false,
    autoSaveTimer: null
  };

  // ============================================================
