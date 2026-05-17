  // SECTION 8: EVENTS
  // ============================================================

  function setupPart2AEvents() {
    // Close modal
    $(document).off('click.up2a-cm', '[data-action="close-modal"]').on('click.up2a-cm', '[data-action="close-modal"]', function(e) {
      e.preventDefault();
      closeModal();
    });
    $(document).off('click.up2a-cb', '.up-modal-backdrop').on('click.up2a-cb', '.up-modal-backdrop', function(e) {
      if ($(e.target).hasClass('up-modal-backdrop')) closeModal();
    });

    // Modal save — dispatches to whichever modal opened the dialog.
    // All current modal callers (change-default, add-custom-provider)
    // pass an onSave callback when calling openModal().
    $(document).off('click.up2a-ms', '[data-action="modal-save"]').on('click.up2a-ms', '[data-action="modal-save"]', function(e) {
      e.preventDefault();
      if (currentModal && currentModal.onSave) currentModal.onSave();
    });

    // Verify key
    $(document).off('click.up2a-vk', '[data-action="verify-key"]').on('click.up2a-vk', '[data-action="verify-key"]', function(e) {
      e.preventDefault();
      var providerId = $(this).data('provider');
      verifyApiKey(providerId);
    });

    // Allow Enter key to trigger verify
    $(document).off('keydown.up2a-vke', '#upProviderKey').on('keydown.up2a-vke', '#upProviderKey', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('#upVerifyBtn').click();
      }
    });

    // Model toggle in modal
    $(document).off('change.up2a-mt', '.up-mm-toggle').on('change.up2a-mt', '.up-mm-toggle', function() {
      var $card = $(this).closest('.up-mm-card');
      var isOn = $(this).is(':checked');
      var $toggle = $card.find('.up-toggle');
      if (isOn) {
        $card.addClass('up-mm-card--on');
        $toggle.addClass('up-toggle--on');
        // Show star
        var modelId = $(this).data('model');
        if (!$card.find('.up-mm-star').length) {
          $card.append('<span class="up-star up-mm-star" data-model="' + esc(modelId) + '" title="Set as default">' + icon('star') + '</span>');
        }
      } else {
        $card.removeClass('up-mm-card--on');
        $toggle.removeClass('up-toggle--on');
        $card.find('.up-mm-star').remove();
      }
    });

    // Model default star in modal
    $(document).off('click.up2a-mds', '.up-mm-star').on('click.up2a-mds', '.up-mm-star', function(e) {
      e.preventDefault();
      e.stopPropagation();
      $('.up-mm-star').removeClass('up-star--on');
      $(this).addClass('up-star--on');
    });

    // Remove provider
    $(document).off('click.up2a-rp', '[data-action="remove-provider"]').on('click.up2a-rp', '[data-action="remove-provider"]', function(e) {
      e.preventDefault();
      removeProvider($(this).data('provider'));
    });

    // Change default
    $(document).off('click.up2a-cd', '[data-action="change-default"]').on('click.up2a-cd', '[data-action="change-default"]', function(e) {
      e.preventDefault();
      openChangeDefaultModal();
    });

    // Default provider select → update model options
    $(document).off('change.up2a-dp', '#upDefaultProvider').on('change.up2a-dp', '#upDefaultProvider', function() {
      var pid = $(this).val();
      var $modelSelect = $('#upDefaultModel').empty();
      if (!pid || !S.providerMap[pid]) return;
      var models = (S.providerMap[pid].models || []).filter(function(m) { return m.active; });
      for (var i = 0; i < models.length; i++) {
        $modelSelect.append('<option value="' + esc(models[i].id) + '">' + esc(models[i].label) + '</option>');
      }
    });

    // Temperature slider
    $(document).off('input.up2a-ts', '#upParamTemp').on('input.up2a-ts', '#upParamTemp', function() {
      var val = (parseFloat($(this).val()) / 100).toFixed(2);
      $('#upParamTempVal').text(val);
    });

    // Top P slider
    $(document).off('input.up2a-tp', '#upParamTopP').on('input.up2a-tp', '#upParamTopP', function() {
      var val = (parseFloat($(this).val()) / 100).toFixed(2);
      $('#upParamTopPVal').text(val);
    });

    // Undo/Redo keyboard shortcuts
    $(document).off('keydown.up2a-ur').on('keydown.up2a-ur', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    });

    // Quick test connection (inline on provider card)
    $(document).off('click.up2a-qt', '[data-action="quick-test"]').on('click.up2a-qt', '[data-action="quick-test"]', function(e) {
      e.preventDefault();
      e.stopPropagation();
      quickTestConnection($(this).data('provider'));
    });

    // Test all connections
    $(document).off('click.up2a-ta', '[data-action="test-all-connections"]').on('click.up2a-ta', '[data-action="test-all-connections"]', function(e) {
      e.preventDefault();
      testAllConnections();
    });

    // Escape to close modal
    $(document).off('keydown.up2a-esc').on('keydown.up2a-esc', function(e) {
      if (e.key === 'Escape') {
        if ($('.up-confirm-backdrop').length) closeConfirmDialog();
        else if ($('.up-modal-backdrop').length) closeModal();
      }
    });
  }

  // ============================================================
