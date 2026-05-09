---
name: model-provider-updater
description: Update FastGPT plugin model provider presets by auditing existing modules/model/provider entries against official provider model catalogs. Use when asked to refresh, add, remove, or verify FastGPT model provider presets, check for new models, remove deprecated models, or keep provider files aligned with official model docs.
---

# Model Provider Updater

Use this skill to update the FastGPT plugin model registry in `modules/model/provider/*/index.ts`.
Only work on providers already registered by `modules/model/init.ts`; never add a new provider directory or init import as part of this workflow.

## Workflow

1. Inventory the current registry.

   ```bash
   node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs inventory
   ```

   Use `--json` when another script or a temporary comparison file needs structured output.

2. Check providers one by one against official sources.

   Start from `references/provider_sources.json`, but verify the current official page/API during the run because model catalogs change often. Use official provider docs, official pricing/model pages, or official model-list APIs. Do not use third-party blogs, search snippets, or aggregator pages as removal evidence unless the provider is that aggregator, such as OpenRouter.

   `check-sources` only checks whether source-hint URLs are reachable enough to use as starting points. A 403 access-limited result can still be acceptable for docs that block automated requests, and a passing source check is not evidence that the provider catalog was audited.

3. Classify differences conservatively.

   Add a preset when an official source lists a model that is absent locally and it belongs to an existing provider. Clone the closest existing preset in the same provider and family, then adjust context, output limit, vision, reasoning, tool calling, response-format, and field-map fields from official docs or the closest local pattern.

   Remove a preset only when an official source explicitly marks the model as deprecated, retired, unavailable, or when an authoritative model-list API/document states that only the returned/listed models are supported and the local model is absent. Do not delete local custom placeholders in `Other`, `Ollama`, `HuggingFace`, `OpenRouter`, or similar open catalogs unless the provider explicitly removes that exact model from its own official API/catalog.

   Remove preview, experimental, or dated candidate presets when the same model family has a stable public model ID in the same provider and official docs describe the preview/experimental ID as deprecated, superseded, unavailable, or no longer recommended. Do not remove a preview ID solely because a stable-looking sibling exists; keep it when official docs still list it as current, required for a distinct capability, or the stable ID has not reached the same capability.

4. Create and apply an update plan.

   Generate a template and fill only confirmed additions/removals:

   ```bash
   node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs plan-template --provider OpenAI > /tmp/model-provider-plan.json
   ```

   Dry-run before writing:

   ```bash
   node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs apply-plan --plan /tmp/model-provider-plan.json --dry-run
   node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs apply-plan --plan /tmp/model-provider-plan.json --write
   ```

   The plan format is documented in `references/plan.example.json`. That file includes an intentionally unregistered `ExampleProvider` shape example, so use `plan-template` for executable plans instead of applying the example file directly. Keep every audited provider in the plan:
   - Use `auditStatus: "checked"` with empty `add` and `remove` when the provider was checked and no registry change is needed.
   - Use `auditStatus: "changed"` when adding or removing presets.
   - Leave `auditStatus: "pending"` only for providers not yet checked.

   `replace` supports top-level provider-model fields only, such as `maxContext`, `maxTokens`, `vision`, `reasoning`, `responseFormatList`, or `fieldMap`. Do not use dotted paths such as `fieldMap.max_tokens`; replace the full top-level object instead.

   The script only edits providers registered by `modules/model/init.ts`, skips already-present additions, applies additions before removals within a provider, validates the whole plan before writing any file, and errors if `cloneFrom` or required evidence fields are missing.

5. Validate.

   ```bash
   bun run test
   bun tsc --noEmit
   ```

   If the full suite is too broad for the change, run the model inventory plus targeted TypeScript validation and state the skipped coverage clearly.

## Evidence Rules

- Record the official source URL and check date in the plan for every provider audited, including providers with no changes.
- For removals, record a non-empty official-source reason on each remove item. Do not use string-only remove entries.
- Prefer primary API references over marketing pages when fields disagree.
- Treat aliases such as `*-latest` as stable presets only if the provider documents them as public model IDs.
- Keep existing ordering style inside each provider file: newest or most capable models first when that is already the local pattern.
- Preserve local compatibility fields unless official docs prove they are wrong.

## Helper Script

`scripts/model_provider_presets.mjs` supports:

- `inventory`: list registered providers, provider files, model counts, and type counts.
- `plan-template`: create a JSON update plan skeleton for all or selected providers.
- `apply-plan`: mechanically add cloned presets and remove confirmed deprecated presets.
- `check-sources`: sanity-check source hint URLs from `references/provider_sources.json`.

Use the script for repeatable mechanics, then review the diff manually before final validation.
