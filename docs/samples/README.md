# Sample data

Reference blobs that mirror what lives in Drupal's `field_json_data` and
`field_llm_config` textareas at runtime. Use these when seeding a local
Drupal node, when writing tests against `migrateData()` /
`buildLLMConfig()`, or when documenting the producer/consumer contract
for sibling apps.

| File | Drupal field | Description |
| --- | --- | --- |
| `field-json-data.empty.json` | `field_json_data` | Empty profile — what a brand-new user node holds before any save. `migrateData()` will hydrate this with the full `MODEL_CATALOG` on first load. |
| `field-json-data.populated.json` | `field_json_data` | Realistic post-onboarding profile: Gemini + Groq + OpenRouter configured, each with verified-but-mocked keys, plus a small activity feed. Safe to commit (no real keys). |
| `field-llm-config.example.json` | `field_llm_config` | Clean output that `buildLLMConfig()` would derive from the populated sample above. This is the contract every consumer app reads via `.llm-config-data`. |

> All API key values in these samples are obviously fake placeholders
> (`gemini-mock-key-PLACEHOLDER`, etc.). Never commit a real key.
