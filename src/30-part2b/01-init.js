/**
 * User Profile App v1.0 - Part 2B: Advanced Features
 *
 * Live model refresh, LLM config preview modal, import/export,
 * bulk model operations, data reset, keyboard shortcuts.
 *
 * Sections:
 *  1. Init & Imports
 *  2. Live Model Refresh (API-based model discovery)
 *  3. LLM Config Preview Modal
 *  4. Import / Export
 *  5. Bulk Model Operations
 *  6. Data Reset
 *  7. Keyboard Shortcuts
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
  var esc, deepClone, icon, logActivity, formatDate, formatRelativeTime, maskKey;
  var Constants, buildLLMConfig, getProviderColor;
  var snapshot, openModal, closeModal, openConfirmDialog, closeConfirmDialog;

  var _checkCount = 0;
  var checkInterval = setInterval(function() {
    _checkCount++;
    if (window._upPart2A && window._upState && window._upState.initialized) {
      clearInterval(checkInterval);
      initPart2B();
    } else if (_checkCount > 150) {
      clearInterval(checkInterval);
      console.error('[UP] Part 2B: Timed out waiting for Part 2A');
    }
  }, 100);

  function initPart2B() {
    console.log('[UP] Initializing Part 2B...');

    S = window._upState;
    render = window._upRender;
    navigate = window._upNavigate;
    toast = window._upToast;
    generateId = window._upGenerateId;
    buildMaps = window._upBuildMaps;
    syncToTextarea = window._upSyncToTextarea;
    esc = window._upEsc;
    deepClone = window._upDeepClone;
    icon = window._upIcon;
    logActivity = window._upLogActivity;
    formatDate = window._upFormatDate;
    formatRelativeTime = window._upFormatRelativeTime;
    maskKey = window._upMaskKey;
    Constants = window._upConstants;
    buildLLMConfig = window._upBuildLLMConfig;
    getProviderColor = window._upGetProviderColor;

    var P2A = window._upPart2A;
    snapshot = P2A.snapshot;
    openModal = P2A.openModal;
    closeModal = P2A.closeModal;
    openConfirmDialog = P2A.openConfirmDialog;
    closeConfirmDialog = P2A.closeConfirmDialog;

    // Wrap handler-setup so a failure in one block does not disable the
    // other. _upSafeBlock is exposed by Part 1; fallback defined inline
    // in case Part 1 ever ships without it.
    var safeBlock = window._upSafeBlock || function(n, f) { try { f(); } catch (e) { console.error('[UP] Handler block "' + n + '" failed:', e); } };
    safeBlock('part2b-events', setupPart2BEvents);
    safeBlock('part2b-shortcuts', setupKeyboardShortcuts);

    if (render) render();
    console.log('[UP] Part 2B initialized');
  }

  // ============================================================
