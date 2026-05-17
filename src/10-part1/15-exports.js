  // SECTION 15: API EXPORTS
  // ============================================================

  window._upState = S;
  // Core
  window._upRender = renderCurrentView;
  window._upNavigate = navigate;
  window._upToast = toast;
  window._upGenerateId = generateId;
  window._upBuildMaps = buildMaps;
  window._upSyncToTextarea = syncToTextarea;
  window._upUpdateSaveStatus = updateSaveStatus;
  window._upLogActivity = logActivity;
  // Resilience seam used by Part 2A/2B handler-setup wrappers
  window._upSafeBlock = _safeBlock;
  window._upBuildLLMConfig = buildLLMConfig;
  // Utilities
  window._upEsc = esc;
  window._upIcon = icon;
  window._upDeepClone = deepClone;
  window._upTruncate = truncate;
  window._upMaskKey = maskKey;
  window._upDebounce = debounce;
  window._upIsEmpty = isEmpty;
  // Formatters
  window._upFormatDate = formatDate;
  window._upFormatRelativeTime = formatRelativeTime;
  // Getters
  window._upGetRecentActivity = getRecentActivity;
  window._upGetFilteredProviders = getFilteredProviders;
  window._upGetProviderColor = getProviderColor;
  window._upCategoryPill = categoryPill;
  // Constants
  window._upConstants = {
    APP_VIEWS: APP_VIEWS,
    MODEL_CATALOG: MODEL_CATALOG,
    PROVIDER_ORDER: PROVIDER_ORDER,
    RECOMMENDED_ORDER: RECOMMENDED_ORDER,
    REMOVED_PROVIDERS: REMOVED_PROVIDERS,
    PROVIDER_EDITOR_HASH_PREFIX: PROVIDER_EDITOR_HASH_PREFIX,
    ACTIVITY_TYPES: ACTIVITY_TYPES,
    CATEGORY_LABELS: CATEGORY_LABELS
  };

  console.log('[UP] Part 1 loaded');
})(jQuery, Drupal);
