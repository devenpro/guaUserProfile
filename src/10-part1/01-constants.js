  // SECTION 1: CONSTANTS
  // ============================================================

  var APP_VIEWS = {
    'dashboard':  { order: 1, label: 'Dashboard',  icon: 'chart-line',  description: 'Provider overview & activity' },
    'providers':  { order: 2, label: 'Providers',   icon: 'bolt',        description: 'Configure API keys' },
    'models':     { order: 3, label: 'Models',      icon: 'layer-group', description: 'Model management' }
  };

  // Special parameterised route — not in APP_VIEWS because it takes an
  // `:id` path segment (#provider/<id>) and is not shown in the sidebar.
  var PROVIDER_EDITOR_HASH_PREFIX = 'provider/';

  // Per-provider guide block. Surfaced in the full-page editor's right
  // column and in the dashboard "Recommended Providers" rail.
  //   signup_url:      where to register an account
  //   key_url:         deep link to the API-key page inside the provider's dashboard
  //   key_format:      human-readable hint about the API key's prefix/shape
  //   free_tier:       short note about free quota (empty string if paid-only)
  //   steps:           ordered { title, body } pairs walking through key setup
  //   troubleshooting: { issue, fix } pairs for common verify failures
  var MODEL_CATALOG = {
    'gemini': {
      label: 'Gemini', icon: 'sparkles', category: 'major',
      desc: "Google's multimodal AI family", color: '#4285F4',
      test_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      test_method: 'gemini',
      free_tier: true,
      recommended_rank: 1,
      guide: {
        signup_url: 'https://aistudio.google.com/',
        key_url: 'https://aistudio.google.com/app/apikey',
        key_format: 'Starts with "AIza" — about 39 characters.',
        free_tier: 'Free tier with generous daily quota for Gemini 2.5 Flash and Flash Lite. No credit card required to start.',
        steps: [
          { title: 'Sign in with Google',  body: 'Open Google AI Studio and sign in with any Google account.' },
          { title: 'Create an API key',    body: 'In AI Studio, click "Get API key" and then "Create API key". Pick "Create API key in a new project" if you do not already have one.' },
          { title: 'Copy the key',         body: 'Copy the AIza… string and paste it into the API Key field on the left. The key is shown only once — store it somewhere safe.' },
          { title: 'Verify',               body: 'Click "Verify Key". We send a 1-token "Hello" request to confirm the key works. On success, the model picker unlocks.' }
        ],
        troubleshooting: [
          { issue: 'API_KEY_INVALID or 400 error',  fix: 'You may have pasted the key with whitespace or trimmed it. Re-copy from AI Studio.' },
          { issue: 'Quota exceeded',                fix: 'Free-tier quota resets daily. Switch to a different free model (e.g., Flash Lite) or wait.' },
          { issue: 'Region blocked',                fix: 'Gemini API is unavailable in some regions. A VPN or paid OpenRouter route can be used instead.' }
        ]
      },
      models: [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', category: 'powerful', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', category: 'fast', default_temp: 0.7, max_tokens: 8192 }
      ]
    },
    'openai': {
      label: 'OpenAI', icon: 'cpu', category: 'major',
      desc: 'GPT & o-series models', color: '#10A37F',
      test_endpoint: 'https://api.openai.com/v1/chat/completions',
      test_method: 'openai',
      free_tier: false,
      recommended_rank: null,
      guide: {
        signup_url: 'https://platform.openai.com/signup',
        key_url: 'https://platform.openai.com/api-keys',
        key_format: 'Starts with "sk-" — about 50+ characters.',
        free_tier: 'Pay-as-you-go. No free monthly credit for new accounts in most regions; you must add a payment method before keys will work.',
        steps: [
          { title: 'Create an account',     body: 'Sign up at platform.openai.com and verify your phone number.' },
          { title: 'Add a payment method',  body: 'OpenAI keys do not work until billing is set up. Add a card under Settings → Billing.' },
          { title: 'Create a secret key',   body: 'Open the API keys page and click "Create new secret key". Copy the sk-… string before you close the dialog — it is not shown again.' },
          { title: 'Verify',                body: 'Paste the key into the field on the left and click Verify. We make a 1-token chat request to confirm it works.' }
        ],
        troubleshooting: [
          { issue: '401 Unauthorized',              fix: 'Key is wrong or revoked. Generate a new one.' },
          { issue: 'You exceeded your current quota', fix: 'Add a payment method and at least USD $5 in prepaid credit.' },
          { issue: 'Insufficient permissions',      fix: 'If using a project-scoped key, ensure the project has access to the model you want to test.' }
        ]
      },
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
      free_tier: false,
      recommended_rank: null,
      guide: {
        signup_url: 'https://console.x.ai/',
        key_url: 'https://console.x.ai/team/default/api-keys',
        key_format: 'Starts with "xai-" — long alphanumeric.',
        free_tier: 'Limited monthly free credits on signup, then pay-as-you-go.',
        steps: [
          { title: 'Sign up for xAI Console',  body: 'Create an account at console.x.ai using your X (Twitter) login or email.' },
          { title: 'Create an API key',        body: 'In the Console, open "API Keys" and create a new key. Give it permission to call the Chat endpoint.' },
          { title: 'Verify',                   body: 'Paste the xai-… key and click Verify.' }
        ],
        troubleshooting: [
          { issue: '403 Forbidden', fix: 'Your key may not have chat permissions. Edit the key in the Console and enable Chat Completions.' }
        ]
      },
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
      free_tier: false,
      recommended_rank: null,
      guide: {
        signup_url: 'https://www.perplexity.ai/settings/api',
        key_url: 'https://www.perplexity.ai/settings/api',
        key_format: 'Starts with "pplx-".',
        free_tier: 'Free monthly API credit for Perplexity Pro subscribers. Pay-as-you-go above that.',
        steps: [
          { title: 'Sign in to Perplexity', body: 'Log into perplexity.ai and open Settings → API.' },
          { title: 'Generate an API key',   body: 'Click "Generate" and copy the pplx-… token.' },
          { title: 'Verify',                body: 'Paste and verify — the Sonar models are queried for the test.' }
        ],
        troubleshooting: []
      },
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
      free_tier: true,
      recommended_rank: 6,
      guide: {
        signup_url: 'https://platform.deepseek.com/',
        key_url: 'https://platform.deepseek.com/api_keys',
        key_format: 'Starts with "sk-" — DeepSeek follows the OpenAI key shape.',
        free_tier: 'Promotional free credits on signup (subject to change). Otherwise very low-cost pay-as-you-go.',
        steps: [
          { title: 'Sign up at platform.deepseek.com',  body: 'Create an account with email or GitHub.' },
          { title: 'Create API key',                    body: 'Open "API Keys" and click "Create new API key". Copy the sk-… string.' },
          { title: 'Verify',                            body: 'Paste the key and verify.' }
        ],
        troubleshooting: [
          { issue: '402 Insufficient Balance', fix: 'Top up your account from the Billing page — even the free promotional credit needs to be activated first.' }
        ]
      },
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
      free_tier: true,
      recommended_rank: 2,
      guide: {
        signup_url: 'https://console.groq.com/',
        key_url: 'https://console.groq.com/keys',
        key_format: 'Starts with "gsk_".',
        free_tier: 'Generous free tier with daily token + request limits. No credit card required.',
        steps: [
          { title: 'Sign in to Groq Cloud',  body: 'Open console.groq.com and sign in with Google or GitHub.' },
          { title: 'Create an API key',      body: 'In the side nav, open "API Keys" and click "Create API Key". Name it (e.g. "User Profile App") and copy the gsk_… string.' },
          { title: 'Verify',                 body: 'Paste the key on the left and click Verify. The default Llama-3.3-70B model is used for the test.' }
        ],
        troubleshooting: [
          { issue: 'Rate-limited (429)',     fix: 'Free tier has per-minute caps. Wait a minute or upgrade.' }
        ]
      },
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
      free_tier: true,
      recommended_rank: 5,
      guide: {
        signup_url: 'https://console.mistral.ai/',
        key_url: 'https://console.mistral.ai/api-keys/',
        key_format: 'Mixed alphanumeric, no fixed prefix.',
        free_tier: 'La Plateforme "experiment" tier — free for testing, rate-limited. Paid tier for production.',
        steps: [
          { title: 'Create a Mistral account',  body: 'Sign up at console.mistral.ai and verify your email.' },
          { title: 'Subscribe to a workspace',  body: 'Pick the free "Experiment" plan to start.' },
          { title: 'Create an API key',         body: 'Open "API keys" and create one. Copy the key when shown.' },
          { title: 'Verify',                    body: 'Paste and verify — mistral-small-latest is used for the test.' }
        ],
        troubleshooting: []
      },
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
      free_tier: true,
      recommended_rank: null,
      guide: {
        signup_url: 'https://github.com/marketplace/models',
        key_url: 'https://github.com/settings/tokens',
        key_format: 'Fine-grained personal access token — "github_pat_…" or classic "ghp_…".',
        free_tier: 'Free for personal use with rate limits — designed for prototyping. Production use requires Azure AI Foundry.',
        steps: [
          { title: 'Open GitHub Models marketplace',  body: 'Visit github.com/marketplace/models and pick a model to confirm access.' },
          { title: 'Create a personal access token',  body: 'Open Settings → Developer settings → Personal access tokens → Fine-grained tokens. Create a token with the "Models" permission set to "Read & write".' },
          { title: 'Verify',                          body: 'Paste the token and click Verify.' }
        ],
        troubleshooting: [
          { issue: '403 Forbidden', fix: 'Token does not have the Models permission. Recreate it with the right scope.' }
        ]
      },
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
      free_tier: true,
      recommended_rank: null,
      guide: {
        signup_url: 'https://dashboard.cohere.com/',
        key_url: 'https://dashboard.cohere.com/api-keys',
        key_format: 'Long alphanumeric string, no fixed prefix.',
        free_tier: 'Free trial API keys are rate-limited but unlimited in duration. Production keys are paid.',
        steps: [
          { title: 'Create a Cohere account',  body: 'Sign up at dashboard.cohere.com.' },
          { title: 'Pick a trial key',         body: 'Cohere auto-generates a trial key on signup — visible under API Keys. Copy it.' },
          { title: 'Verify',                   body: 'Paste and verify — Cohere uses a v2 chat endpoint.' }
        ],
        troubleshooting: []
      },
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
      free_tier: true,
      recommended_rank: null,
      guide: {
        signup_url: 'https://build.nvidia.com/',
        key_url: 'https://build.nvidia.com/',
        key_format: 'Starts with "nvapi-".',
        free_tier: 'Free monthly credits for personal accounts — enough to evaluate Llama, Mixtral, Nemotron etc.',
        steps: [
          { title: 'Sign in to NVIDIA Build',  body: 'Open build.nvidia.com and sign in with an NVIDIA account.' },
          { title: 'Open any model',           body: 'Pick a model card; the right-hand "Get API Key" button reveals your nvapi-… token.' },
          { title: 'Verify',                   body: 'Paste and verify.' }
        ],
        troubleshooting: []
      },
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
      free_tier: true,
      recommended_rank: 3,
      guide: {
        signup_url: 'https://huggingface.co/join',
        key_url: 'https://huggingface.co/settings/tokens',
        key_format: 'Starts with "hf_".',
        free_tier: 'Free serverless inference with shared rate limits. Pro accounts get higher quotas. Many open models route through here for zero cost.',
        steps: [
          { title: 'Create a Hugging Face account', body: 'Sign up at huggingface.co.' },
          { title: 'Generate an access token',      body: 'Open Settings → Access Tokens → New token. Pick the "Read" role for inference-only use. Copy the hf_… string.' },
          { title: 'Verify',                        body: 'Paste and verify — Qwen 2.5 72B is used for the test by default.' }
        ],
        troubleshooting: [
          { issue: 'Model loading (503)',  fix: 'Some open models are cold-started on demand. Wait a few seconds and try again.' },
          { issue: '401 Unauthorized',     fix: 'The token role must include inference. Regenerate with "Read" or higher.' }
        ]
      },
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
      free_tier: true,
      recommended_rank: 7,
      guide: {
        signup_url: 'https://api.together.ai/signup',
        key_url: 'https://api.together.ai/settings/api-keys',
        key_format: 'Long alphanumeric, no fixed prefix.',
        free_tier: 'Sign-up grants USD $1+ free credits — enough to evaluate Llama 405B, Qwen Coder, DeepSeek R1.',
        steps: [
          { title: 'Sign up for Together AI', body: 'Create an account at api.together.ai.' },
          { title: 'Create an API key',       body: 'Open Settings → API Keys → Create. Copy the key.' },
          { title: 'Verify',                  body: 'Paste and verify — the first catalog model is used for the test.' }
        ],
        troubleshooting: []
      },
      models: [
        { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Llama 3.1 405B', category: 'powerful', default_temp: 0.7, max_tokens: 4096 },
        { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen 2.5 Coder 32B', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    },
    'openrouter': {
      label: 'OpenRouter', icon: 'shuffle', category: 'infra',
      desc: 'Multi-provider router (incl. Claude, GPT-4, Gemini)', color: '#8B5CF6',
      test_endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      test_method: 'openai',
      free_tier: true,
      recommended_rank: 4,
      guide: {
        signup_url: 'https://openrouter.ai/',
        key_url: 'https://openrouter.ai/keys',
        key_format: 'Starts with "sk-or-v1-".',
        free_tier: 'Some routed models are completely free (look for "(free)" in the model list). Others charge a small markup over the upstream provider. This is the recommended route to reach Anthropic Claude from a browser because Anthropic\'s direct API is browser-hostile.',
        steps: [
          { title: 'Sign in to OpenRouter',   body: 'Sign in at openrouter.ai with Google, GitHub or email.' },
          { title: 'Create an API key',       body: 'Open Keys → Create Key. Copy the sk-or-v1-… string.' },
          { title: 'Verify',                  body: 'Paste and verify. The Gemini 2.5 Flash route is used for the connectivity test.' },
          { title: 'Discover models',         body: 'After verifying, use "Refresh from API" inside the editor to pull the live list — there are hundreds of routes including Anthropic Claude, OpenAI GPT-4, Gemini and many free open-source models.' }
        ],
        troubleshooting: [
          { issue: 'Free model returns 429', fix: 'Free routes have aggressive daily caps. Switch to another free model or add credit.' }
        ]
      },
      models: [
        { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (OR)', category: 'fast', default_temp: 0.7, max_tokens: 8192 },
        { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (OR)', category: 'balanced', default_temp: 0.7, max_tokens: 8192 },
        { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (OR)', category: 'powerful', default_temp: 0.6, max_tokens: 8192 }
      ]
    }
  };

  // Ordered list of provider IDs for consistent iteration.
  // NOTE: `claude` was removed in v0.2.0 — Anthropic's direct API is browser-hostile.
  // Users who want Claude should route through OpenRouter (anthropic/claude-sonnet-4 etc.).
  // Existing user data with id='claude' is stripped on migration.
  var PROVIDER_ORDER = [
    'gemini', 'openai', 'grok', 'perplexity', 'deepseek',
    'groq', 'mistral', 'github', 'cohere', 'nvidia', 'huggingface', 'together', 'openrouter'
  ];

  // Providers we actively promote on the dashboard rail. Ordered most→least
  // recommended. Synthesised from MODEL_CATALOG[*].recommended_rank where the
  // value is a positive number; kept as a flat list here so the order can be
  // tweaked without re-sorting at runtime.
  var RECOMMENDED_ORDER = [
    'gemini', 'groq', 'huggingface', 'openrouter', 'mistral', 'deepseek', 'together'
  ];

  // Providers retired from the catalog. Used by migrateData() to strip
  // stale entries from user data on next load. Keys are the deprecated
  // provider id; values explain why (for the activity log).
  var REMOVED_PROVIDERS = {
    'claude': 'Direct Anthropic API is browser-hostile. Use OpenRouter (anthropic/claude-sonnet-4) instead.'
  };

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
