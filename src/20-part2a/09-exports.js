  // SECTION 9: API EXPORTS
  // ============================================================

  window._upPart2A = {
    snapshot: snapshot,
    undo: undo,
    redo: redo,
    openModal: openModal,
    closeModal: closeModal,
    openConfirmDialog: openConfirmDialog,
    closeConfirmDialog: closeConfirmDialog,
    openProviderModal: openProviderModal,
    saveProviderFromModal: saveProviderFromModal,
    removeProvider: removeProvider,
    openChangeDefaultModal: openChangeDefaultModal,
    openAddCustomProviderModal: openAddCustomProviderModal,
    verifyApiKey: verifyApiKey,
    quickTestConnection: quickTestConnection,
    testAllConnections: testAllConnections
  };

  console.log('[UP] Part 2A loaded');
})(jQuery, Drupal);
