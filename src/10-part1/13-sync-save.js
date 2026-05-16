  // SECTION 13: SYNC & SAVE
  // ============================================================

  function syncToTextarea() {
    if (!S.$textarea || !S.$textarea.length) return;

    // Write working data
    S.$textarea.val(JSON.stringify(S.data, null, 2)).trigger('change');

    // Write LLM config export
    if (S.$llmConfigTextarea && S.$llmConfigTextarea.length) {
      var llmConfig = buildLLMConfig();
      S.$llmConfigTextarea.val(JSON.stringify(llmConfig, null, 2)).trigger('change');
    }

    S.dirty = true;
    updateSaveStatus('unsaved');
  }

  function updateSaveStatus(status) {
    var $s = $('.up-save-status');
    if (status === 'saving') {
      $s.html(icon('refresh') + ' Saving...').removeClass('up-saved up-unsaved').addClass('up-saving');
    } else if (status === 'saved') {
      $s.html(icon('check') + ' Saved').removeClass('up-saving up-unsaved').addClass('up-saved');
      S.dirty = false;
    } else {
      $s.html(icon('circle') + ' Unsaved').removeClass('up-saving up-saved').addClass('up-unsaved');
    }
  }

  function startAutoSave() {
    if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = setInterval(function() {
      if (S.dirty) { syncToTextarea(); updateSaveStatus('saved'); }
    }, 30000);
  }

  $(window).on('beforeunload', function() {
    if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
  });

  // ============================================================
