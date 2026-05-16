  // SECTION 7: UTILITIES
  // ============================================================

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function icon(name, className) {
    var icons = {
      'chart-line': 'fa-chart-line', 'bolt': 'fa-bolt', 'layer-group': 'fa-layer-group',
      'sparkles': 'fa-sparkles', 'robot': 'fa-robot', 'cpu': 'fa-microchip',
      'search': 'fa-magnifying-glass', 'globe': 'fa-globe', 'chip': 'fa-microchip',
      'users': 'fa-users', 'boxes-stacked': 'fa-boxes-stacked', 'shuffle': 'fa-shuffle',
      'key': 'fa-key', 'lock': 'fa-lock', 'unlock': 'fa-unlock',
      'shield-check': 'fa-shield-check', 'shield': 'fa-shield',
      'check': 'fa-check', 'check-circle': 'fa-circle-check',
      'plus': 'fa-plus', 'minus': 'fa-minus', 'edit': 'fa-pen-to-square',
      'trash': 'fa-trash-can', 'copy': 'fa-copy', 'download': 'fa-download', 'upload': 'fa-upload',
      'refresh': 'fa-arrows-rotate', 'star': 'fa-star',
      'arrow-right': 'fa-arrow-right', 'arrow-left': 'fa-arrow-left',
      'triangle-exclamation': 'fa-triangle-exclamation', 'warning': 'fa-triangle-exclamation',
      'circle-info': 'fa-circle-info', 'info': 'fa-circle-info',
      'success': 'fa-circle-check', 'error': 'fa-circle-xmark',
      'circle-dot': 'fa-circle-dot', 'circle': 'fa-circle',
      'gear': 'fa-gear', 'settings': 'fa-gear', 'clock': 'fa-clock',
      'eye': 'fa-eye', 'eye-off': 'fa-eye-slash',
      'chevron-right': 'fa-chevron-right', 'chevron-down': 'fa-chevron-down',
      'user': 'fa-user', 'sliders': 'fa-sliders',
      'play': 'fa-play', 'pause': 'fa-pause',
      'link': 'fa-link', 'code': 'fa-code',
      'film': 'fa-film', 'video': 'fa-video',
      'lightbulb': 'fa-lightbulb', 'tag': 'fa-tag', 'tags': 'fa-tags',
      'filter': 'fa-filter', 'bars': 'fa-bars',
      'panel-left': 'fa-angles-right', 'panel-left-close': 'fa-angles-left'
    };
    var faClass = icons[name] || 'fa-' + name;
    return '<i class="fas ' + faClass + (className ? ' ' + className : '') + '"></i>';
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function deepClone(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    var now = Date.now();
    var then = new Date(isoStr).getTime();
    if (isNaN(then)) return isoStr;
    var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hour' + (Math.floor(diff / 3600) !== 1 ? 's' : '') + ' ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' day' + (Math.floor(diff / 86400) !== 1 ? 's' : '') + ' ago';
    return formatDate(isoStr);
  }

  function truncate(str, max) {
    if (!str) return '';
    max = max || 50;
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  function maskKey(key) {
    if (!key || key.length < 6) return '••••••••';
    return '••••••••' + key.slice(-4);
  }

  function debounce(fn, ms) {
    var timer;
    return function() {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms || 250);
    };
  }

  function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
  }

  function logActivity(type, description) {
    S.data.activity = S.data.activity || [];
    S.data.activity.push({
      id: generateId('act'),
      type: type,
      description: description,
      timestamp: new Date().toISOString(),
      user_id: S.user.id || '',
      user_name: S.user.fullName || S.user.name || ''
    });
    // Keep last 200 entries
    if (S.data.activity.length > 200) {
      S.data.activity = S.data.activity.slice(-200);
    }
  }

  function getRecentActivity(n) {
    var acts = S.data.activity || [];
    var sorted = acts.slice().reverse();
    return n ? sorted.slice(0, n) : sorted;
  }

  function getProviderColor(providerId) {
    var cat = MODEL_CATALOG[providerId];
    return cat ? cat.color : '#6b7280';
  }

  function categoryPill(cat) {
    var c = CATEGORY_LABELS[cat] || { label: cat || '', color: '#6b7280' };
    return '<span class="up-cat-pill" style="background:' + c.color + '18;color:' + c.color + ';border:1px solid ' + c.color + '30">' + esc(c.label) + '</span>';
  }

  function getFilteredProviders() {
    var providers = S.data.providers || [];
    var f = S.providerFilter;
    if (f === 'configured') return providers.filter(function(p) { return p.api_key && p.api_key.length > 0; });
    if (f === 'unconfigured') return providers.filter(function(p) { return !p.api_key || p.api_key.length === 0; });
    if (f === 'major' || f === 'infra') return providers.filter(function(p) { return p.category === f; });
    return providers;
  }

  // Resilience helper: runs `fn()` in a try/catch and logs failures with a
  // named tag. Used at init() phase boundaries and by Part 2A/2B (via
  // window._upSafeBlock) so a single island's collapse does not disable
  // the rest of the app.
  function _safeBlock(name, fn) {
    try { fn(); }
    catch (e) { console.error('[UP] Handler block "' + name + '" failed:', e); }
  }

  // ============================================================
