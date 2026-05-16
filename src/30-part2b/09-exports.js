  // SECTION 9: API EXPORTS
  // ============================================================

  window._upPart2B = {
    liveRefreshModels: liveRefreshModels,
    openLLMConfigPreview: openLLMConfigPreview,
    exportJSON: exportJSON,
    exportJSONWithKeys: exportJSONWithKeys,
    importJSON: importJSON,
    enableAllModels: enableAllModels,
    disableAllModels: disableAllModels,
    resetAllProviders: resetAllProviders,
    clearActivityLog: clearActivityLog
  };

  console.log('[UP] Part 2B loaded');
})(jQuery, Drupal);
