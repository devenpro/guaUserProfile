  // SECTION 3: LLM CONFIG PREVIEW MODAL
  // ============================================================

  function openLLMConfigPreview() {
    var config = buildLLMConfig();
    var jsonStr = JSON.stringify(config, null, 2);
    var htmlWrapped = '<div class="llm-config-data">' + JSON.stringify(config) + '</div>';
    var provCount = config.providers ? config.providers.length : 0;
    var modelCount = 0;
    if (config.providers) {
      for (var i = 0; i < config.providers.length; i++) {
        modelCount += (config.providers[i].models || []).length;
      }
    }

    var html = '';

    // Info bar
    html += '<div class="up-preview-info">';
    html += '<span class="up-preview-stat">' + icon('bolt') + ' ' + provCount + ' provider' + (provCount !== 1 ? 's' : '') + '</span>';
    html += '<span class="up-preview-stat">' + icon('layer-group') + ' ' + modelCount + ' model' + (modelCount !== 1 ? 's' : '') + '</span>';
    if (config.default_provider) html += '<span class="up-preview-stat">' + icon('star') + ' Default: ' + esc(config.default_provider) + '/' + esc(config.default_model) + '</span>';
    html += '</div>';

    // Tabs
    html += '<div class="up-preview-tabs">';
    html += '<button class="up-preview-tab up-preview-tab--active" data-action="preview-tab" data-tab="json">JSON Preview</button>';
    html += '<button class="up-preview-tab" data-action="preview-tab" data-tab="html">HTML Output</button>';
    html += '<button class="up-preview-tab" data-action="preview-tab" data-tab="consumers">Consuming Apps</button>';
    html += '</div>';

    // JSON tab
    html += '<div class="up-preview-panel" id="upPreviewJson">';
    html += '<div class="up-code-block">';
    html += '<div class="up-code-header"><span>' + icon('code') + ' llm-config.json</span>';
    html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="copy-json">' + icon('copy') + ' Copy</button></div>';
    html += '<pre class="up-code-body" id="upConfigJsonText">' + esc(jsonStr) + '</pre>';
    html += '</div></div>';

    // HTML tab
    html += '<div class="up-preview-panel up-preview-panel--hidden" id="upPreviewHtml">';
    html += '<div class="up-code-block">';
    html += '<div class="up-code-header"><span>' + icon('code') + ' field_llm_config HTML</span>';
    html += '<button class="up-btn up-btn-xs up-btn-outline" data-action="copy-html">' + icon('copy') + ' Copy</button></div>';
    html += '<pre class="up-code-body up-code-body--sm" id="upConfigHtmlText">' + esc(htmlWrapped) + '</pre>';
    html += '</div></div>';

    // Consumers tab
    html += '<div class="up-preview-panel up-preview-panel--hidden" id="upPreviewConsumers">';
    var apps = [
      { name: 'YouTube Video Planner', prefix: 'yvp', color: '#FF0000' },
      { name: 'Social Content Planner', prefix: 'scp', color: '#1a73e8' },
      { name: 'Video Production', prefix: 'vp', color: '#8b5cf6' },
      { name: 'GTM Planner', prefix: 'gtm', color: '#0d904f' },
      { name: 'Local Business Website Planner', prefix: 'lbwp', color: '#e37400' }
    ];
    html += '<div class="up-consumer-list">';
    for (var a = 0; a < apps.length; a++) {
      html += '<div class="up-consumer-card">';
      html += '<span class="up-consumer-dot" style="background:' + apps[a].color + '"></span>';
      html += '<span class="up-consumer-name">' + esc(apps[a].name) + '</span>';
      html += '<code class="up-consumer-code">.llm-config-data</code>';
      html += '<span class="up-consumer-status">' + icon('check-circle') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="up-consumer-note">' + icon('info') + ' All apps read the <code>.llm-config-data</code> div injected by Drupal from <code>field_llm_config</code>.</div>';
    html += '</div>';

    openModal(icon('code') + ' LLM Config Preview', html, {
      size: 'lg',
      footer: false
    });
  }

  // ============================================================
