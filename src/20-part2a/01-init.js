/**
 * User Profile App v1.0 - Part 2A: Provider Configuration Engine
 *
 * Modal system, provider configuration (key → verify → models → params),
 * API key verification, provider CRUD, undo/redo, default management.
 *
 * Sections:
 *  1. Init & Imports
 *  2. Modal System
 *  3. Undo/Redo
 *  4. Provider Configuration Modal (3-step flow)
 *  5. API Key Verification
 *  6. Provider Save & Remove
 *  7. Change Default Modal
 *  8. Events
 *  9. API Exports
 *
 * @version 1.0.0
 */
(function($, Drupal) {
  'use strict';

  // ============================================================
  // SECTION 1: INIT & IMPORTS
  // ============================================================

  var S, render, navigate, toast, generateId, buildMaps, syncToTextarea;
  var updateSaveStatus, esc, deepClone, icon, logActivity;
  var formatDate, formatRelativeTime, truncate, maskKey;
  var getRecentActivity, getFilteredProviders, getProviderColor, categoryPill;
  var buildLLMConfig, Constants;

  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    if (window._upState && window._upState.initialized) {
      clearInterval(checkInterval);
      initPart2A();
    } else if (_checkCount > 100) {
      clearInterval(checkInterval);
      console.error('[UP] Part 2A: Timed out waiting for Part 1');
    }
  }, 100);

  function initPart2A() {
    console.log('[UP] Initializing Part 2A...');

    S = window._upState;
    render = window._upRender;
    navigate = window._upNavigate;
    toast = window._upToast;
    generateId = window._upGenerateId;
    buildMaps = window._upBuildMaps;
    syncToTextarea = window._upSyncToTextarea;
    updateSaveStatus = window._upUpdateSaveStatus;
    esc = window._upEsc;
    deepClone = window._upDeepClone;
    icon = window._upIcon;
    logActivity = window._upLogActivity;
    formatDate = window._upFormatDate;
    formatRelativeTime = window._upFormatRelativeTime;
    truncate = window._upTruncate;
    maskKey = window._upMaskKey;
    getRecentActivity = window._upGetRecentActivity;
    getFilteredProviders = window._upGetFilteredProviders;
    getProviderColor = window._upGetProviderColor;
    categoryPill = window._upCategoryPill;
    buildLLMConfig = window._upBuildLLMConfig;
    Constants = window._upConstants;

    // Register renderers
    var R = window._upRenderers = window._upRenderers || {};
    R.openProviderModal = openProviderModal;
    R.openAddCustomProviderModal = openAddCustomProviderModal;

    // Wrap handler-setup so a failure here does not cascade into Part 2B.
    // _upSafeBlock is exposed by Part 1; fallback defined inline in case
    // Part 1 ever ships without it.
    var safeBlock = window._upSafeBlock || function(n, f) { try { f(); } catch (e) { console.error('[UP] Handler block "' + n + '" failed:', e); } };
    safeBlock('part2a-events', setupPart2AEvents);
    snapshot('Initial state');

    if (render) render();
    console.log('[UP] Part 2A initialized');
  }

  // ============================================================
