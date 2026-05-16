  // SECTION 14: TOAST NOTIFICATIONS
  // ============================================================

  function toast(msg, type, dur) {
    type = type || 'info';
    dur = dur || 3000;
    var $c = $('#upToasts');
    if (!$c.length) { $c = $('<div id="upToasts" class="up-toast-container"></div>'); $('#upApp').append($c); }

    var id = 'toast_' + Date.now();
    var iconName = type === 'success' ? 'success' : (type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'info'));

    $c.append(
      '<div class="up-toast up-toast-' + type + '" id="' + id + '">' +
      '<span class="up-toast-icon">' + icon(iconName) + '</span>' +
      '<span class="up-toast-message">' + esc(msg) + '</span>' +
      '<button class="up-toast-close">&times;</button>' +
      '</div>'
    );

    setTimeout(function() { $('#' + id).addClass('up-toast-show'); }, 10);
    setTimeout(function() {
      $('#' + id).removeClass('up-toast-show');
      setTimeout(function() { $('#' + id).remove(); }, 300);
    }, dur);
  }

  // ============================================================
