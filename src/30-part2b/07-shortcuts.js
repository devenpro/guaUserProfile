  // SECTION 7: KEYBOARD SHORTCUTS
  // ============================================================

  function setupKeyboardShortcuts() {
    $(document).off('keydown.up2b-nav').on('keydown.up2b-nav', function(e) {
      // Don't handle shortcuts when typing in inputs
      if ($(e.target).is('input, textarea, select, [contenteditable="true"]')) return;

      // Alt+1/2/3 for view navigation
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1': e.preventDefault(); navigate('dashboard'); break;
          case '2': e.preventDefault(); navigate('providers'); break;
          case '3': e.preventDefault(); navigate('models'); break;
        }
      }

      // Ctrl+Shift+E → Export
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        exportJSON();
      }

      // Ctrl+S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        syncToTextarea();
        if (S.$submitBtn && S.$submitBtn.length) S.$submitBtn.click();
      }
    });
  }

  // ============================================================
