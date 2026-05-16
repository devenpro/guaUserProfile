  // SECTION 2: MODAL SYSTEM
  // ============================================================

  var currentModal = null;

  function openModal(title, content, options) {
    options = options || {};
    closeModal();
    var size = options.size || 'md';

    var html = '<div class="up-modal-backdrop">';
    html += '<div class="up-modal up-modal-' + size + '">';

    // Header
    html += '<div class="up-modal-header">';
    if (options.headerIcon) {
      html += '<span class="up-modal-header-icon" style="background:' + (options.headerIconColor || 'var(--up-primary)') + '">' + icon(options.headerIcon) + '</span>';
    }
    html += '<div class="up-modal-header-text"><h3>' + title + '</h3>';
    if (options.subtitle) html += '<span class="up-modal-subtitle">' + esc(options.subtitle) + '</span>';
    html += '</div>';
    html += '<button class="up-btn-icon up-modal-close" data-action="close-modal">' + icon('x') + '</button>';
    html += '</div>';

    // Body
    html += '<div class="up-modal-body">' + content + '</div>';

    // Footer
    if (options.footer !== false) {
      html += '<div class="up-modal-footer">';
      if (options.footerLeft) html += '<div class="up-modal-footer-left">' + options.footerLeft + '</div>';
      html += '<div class="up-modal-footer-right">';
      html += '<button class="up-btn up-btn-outline" data-action="close-modal">Cancel</button>';
      if (options.saveLabel !== false) {
        html += '<button class="up-btn up-btn-primary" data-action="modal-save">' + icon('check') + ' ' + (options.saveLabel || 'Save') + '</button>';
      }
      html += '</div></div>';
    }

    html += '</div></div>';
    $('body').append(html);
    currentModal = options;
    setTimeout(function() { $('.up-modal-backdrop').addClass('up-modal-visible'); }, 10);
  }

  function closeModal() {
    $('.up-modal-backdrop').remove();
    currentModal = null;
    _verifyingProvider = null;
  }

  function openConfirmDialog(opts) {
    var html = '<div class="up-confirm-backdrop"><div class="up-confirm-dialog">';
    html += '<h3>' + esc(opts.title || 'Confirm') + '</h3>';
    html += '<p>' + esc(opts.message || 'Are you sure?') + '</p>';
    html += '<div class="up-confirm-actions">';
    html += '<button class="up-btn up-btn-outline" data-action="confirm-cancel">Cancel</button>';
    html += '<button class="up-btn ' + (opts.danger ? 'up-btn-danger-filled' : 'up-btn-primary') + '" data-action="confirm-ok">' + esc(opts.confirmLabel || 'Confirm') + '</button>';
    html += '</div></div></div>';
    $('body').append(html);
    $(document).off('click.up2a-cok').on('click.up2a-cok', '[data-action="confirm-ok"]', function() {
      closeConfirmDialog();
      if (opts.onConfirm) opts.onConfirm();
    });
    $(document).off('click.up2a-ccn').on('click.up2a-ccn', '[data-action="confirm-cancel"]', function() {
      closeConfirmDialog();
    });
  }

  function closeConfirmDialog() {
    $('.up-confirm-backdrop').remove();
    $(document).off('click.up2a-cok click.up2a-ccn');
  }

  // ============================================================
