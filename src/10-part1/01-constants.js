  // SECTION 1: CONSTANTS
  // ============================================================

  var APP_VIEWS = {
    'dashboard':  { order: 1, label: 'Dashboard',  icon: 'chart-line',  description: 'Provider overview & activity' },
    'providers':  { order: 2, label: 'Providers',   icon: 'bolt',        description: 'Configure API keys' },
    'models':     { order: 3, label: 'Models',      icon: 'layer-group', description: 'Model management' }
  };

  var MODEL_CATALOG = {
    'gemini': {
      label: 'Gemini', icon: 'sparkles', category: 'major',
      desc: "Google's multimodal AI family", color: '#4285F4',
      test_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      test_method: 'gemini',
      models: [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'claude': {
      label: 'Claude', icon: 'robot', category: 'major',
      desc: "Anthropic's reasoning-first AI", color: '#D97706',
      test_endpoint: 'https://api.anthropic.com/v1/messages',
      test_method: 'claude',
      models: [
        { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', category: 'fast', default_temp: 0.8, max_tokens: 8192 }
      ]
    },
    'openai': {
      label: 'OpenAI', icon: 'cpu', category: 'major',
      desc: 'GPT & o-series models', color: '#10A37F',
      test_endpoint: 'https://api.openai.com/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'gpt-4.1', label: 'GPT-4.1', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'o3-mini', label: 'o3-mini', category: 'powerful', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'grok': {
      label: 'Grok', icon: 'bolt', category: 'major',
      desc: "xAI's conversational AI", color: '#1DA1F2',
      test_endpoint: 'https://api.x.ai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'grok-3', label: 'Grok 3', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'grok-3-mini', label: 'Grok 3 Mini', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'perplexity': {
      label: 'Perplexity', icon: 'search', category: 'major',
      desc: 'Search-augmented AI answers', color: '#20B2AA',
      test_endpoint: 'https://api.perplexity.ai/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'sonar-pro', label: 'Sonar Pro', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'sonar', label: 'Sonar', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'sonar-deep-research', label: 'Sonar Deep Research', category: 'powerful', default_temp: 0.5, max_tokens: 8192 }
      ]
    },
    'deepseek': {
      label: 'DeepSeek', icon: 'search', category: 'major',
      desc: 'Open-source reasoning models', color: '#5B6CF0',
      test_endpoint: 'https://api.deepseek.com/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'deepseek-r1', label: 'DeepSeek R1', category: 'powerful', default_temp: 0.6, max_tokens: 8192 },
        { id: 'deepseek-v3', label: 'DeepSeek V3', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek-r1-0528', label: 'DeepSeek R1 0528', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'groq': {
      label: 'Groq', icon: 'bolt', category: 'infra',
      desc: 'Ultra-fast LPU inference', color: '#F55036',
      test_endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', category: 'fast', default_temp: 0.8, max_tokens: 8192 },
        { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'mistral': {
      label: 'Mistral', icon: 'sparkles', category: 'major',
      desc: 'European open-weight AI', color: '#FF7000',
      test_endpoint: 'https://api.mistral.ai/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'mistral-large-latest', label: 'Mistral Large', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'mistral-small-latest', label: 'Mistral Small', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'codestral-latest', label: 'Codestral', category: 'balanced', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'github': {
      label: 'GitHub Models', icon: 'globe', category: 'infra',
      desc: 'GitHub-hosted model marketplace', color: '#24292F',
      test_endpoint: 'https://models.inference.ai.azure.com/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'gpt-4o', label: 'GPT-4o (GitHub)', category: 'balanced', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Phi-4', label: 'Phi-4', category: 'fast', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Meta-Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B (GitHub)', category: 'powerful', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'cohere': {
      label: 'Cohere', icon: 'globe', category: 'major',
      desc: 'Enterprise NLP & RAG models', color: '#39594D',
      test_endpoint: 'https://api.cohere.com/v2/chat',
      test_method: 'cohere',
      models: [
        { id: 'command-r-plus', label: 'Command R+', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'command-r', label: 'Command R', category: 'balanced', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'nvidia': {
      label: 'NVIDIA', icon: 'chip', category: 'infra',
      desc: 'NVIDIA NIM endpoints', color: '#76B900',
      test_endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'meta/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', category: 'balanced', default_temp: 0.7, max_tokens: 4096 }
      ]
    },
    'huggingface': {
      label: 'Hugging Face', icon: 'boxes-stacked', category: 'infra',
      desc: 'Open model hub router', color: '#FFD21E',
      test_endpoint: 'https://router.huggingface.co/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'mistralai/Mistral-Small-24B-Instruct-2501', label: 'Mistral Small', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'together': {
      label: 'Together AI', icon: 'users', category: 'infra',
      desc: 'Open-source model cloud', color: '#6366F1',
      test_endpoint: 'https://api.together.xyz/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'openrouter': {
      label: 'OpenRouter', icon: 'shuffle', category: 'infra',
      desc: 'Multi-provider router', color: '#8B5CF6',
      test_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      test_method: 'openai',
      models: [
        { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (OR)', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (OR)', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (OR)', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    }
  };

  // Ordered list of provider IDs for consistent iteration
  var PROVIDER_ORDER = [
    'gemini', 'claude', 'openai', 'grok', 'perplexity', 'deepseek',
    'groq', 'mistral', 'github', 'cohere', 'nvidia', 'huggingface', 'together', 'openrouter'
  ];

  var ACTIVITY_TYPES = {
    'provider-configured': { icon: 'key', color: '#1a73e8' },
    'key-verified':        { icon: 'shield-check', color: '#0d904f' },
    'key-failed':          { icon: 'triangle-exclamation', color: '#d93025' },
    'model-toggled':       { icon: 'layer-group', color: '#3b82f6' },
    'default-changed':     { icon: 'star', color: '#e37400' },
    'provider-removed':    { icon: 'trash', color: '#ef4444' },
    'llm-config-synced':   { icon: 'refresh', color: '#8b5cf6' },
    'settings-changed':    { icon: 'gear', color: '#6b7280' }
  };

  var CATEGORY_LABELS = {
    'fast':     { label: 'Fast',     color: '#0d904f' },
    'balanced': { label: 'Balanced', color: '#1a73e8' },
    'powerful': { label: 'Powerful', color: '#8b5cf6' }
  };

  // ============================================================
