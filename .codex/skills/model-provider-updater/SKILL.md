---
name: model-provider-updater
description: Update FastGPT plugin static model provider presets by auditing packages/infrastructure/src/static-data/models/provider entries against official provider model catalogs. Use when asked to refresh, add, or verify FastGPT model provider presets, check for new models, or keep provider files aligned with official model docs.
---

# Model Provider Updater

Use this repo-level skill to update the FastGPT plugin static model registry in `packages/infrastructure/src/static-data/models/provider/*/index.ts`.
Only work on providers already registered by `packages/infrastructure/src/static-data/models/index.ts`; never add a new provider directory or registry import as part of this workflow unless the user explicitly asks to add a new provider.

This skill was restored from the old `.codex/skills/model-provider-updater` layout. The plugin code has since moved from the legacy `modules/model/*` tree into the v1 `packages/infrastructure/src/static-data/models/*` tree, so use the paths and commands below rather than the old `modules/model` or `.agents/skills` paths.

## Add-Only Policy

This workflow is strictly additive. Never remove an existing provider preset, even when an official source marks it deprecated, retired, unavailable, superseded, or absent from the current catalog. Record such findings in the run summary when useful, but leave the registry entry unchanged.

Every executable update plan must keep each provider's `remove` array empty. The helper script retains removal support for legacy or explicitly separate workflows, but this skill must not populate or apply removal operations.

## Complete-Audit Invariant

A repository-wide refresh is complete only when every provider currently registered by `packages/infrastructure/src/static-data/models/index.ts` appears exactly once in the plan and has a non-pending audit result. Never infer coverage from the number of changed files: providers with no additions must still be recorded as checked.

`apply-plan` enforces this invariant by default and rejects missing providers, duplicate aliases, or `auditStatus: "pending"`. Use `--allow-partial` only when the user explicitly scopes the request to named providers; never use it to make an incomplete full refresh pass.

Coverage alone is not sufficient. Each provider audit must also preserve a verifiable catalog diff:

- Check every URL prefilled from `references/provider_sources.json`; add newly discovered official catalog, release-note, deprecation, or pricing URLs when they are needed to establish the current state.
- Record every exact, in-scope primary model ID found in official sources in `candidateModelIds`, including candidates that will be deliberately skipped.
- Compare `candidateModelIds` with the local inventory. Every candidate missing locally must appear in exactly one of `add` or `skip`; every `skip` entry requires a concrete reason.
- Record `checkedAt` as the current run date. Stale plans are rejected and must be re-audited rather than replayed.
- Set `catalogStatus` to `reviewed` when an official in-scope catalog was enumerated. Use `no-in-scope-models`, `dynamic-catalog`, or `no-authoritative-catalog` only when that is the actual result, and explain it in `auditNote`.

This candidate ledger is the completion proof. A reachable page, a search snippet, or an `auditStatus` marker by itself is never proof that the catalog was scanned.

## Workflow

1. Inventory the current registry.

   ```bash
   node .codex/skills/model-provider-updater/scripts/model_provider_presets.mjs inventory
   ```

   Use `--json` when another script or a temporary comparison file needs structured output.

2. Check every registered provider one by one against official sources.

   Start from every URL listed for that provider in `references/provider_sources.json`, but verify the current official page/API during the run because model catalogs change often. When a provider publishes both a catalog and release notes/changelog, inspect both: catalog pages can lag a just-released model. Use official provider docs, official pricing/model pages, release notes, deprecation pages, or official model-list APIs. Do not use third-party blogs, search snippets, or aggregator pages as evidence unless the provider is that aggregator, such as OpenRouter.

   `check-sources` only checks whether source-hint URLs are reachable enough to use as starting points. A 403 access-limited result can still be acceptable for docs that block automated requests, and a passing source check is not evidence that the provider catalog was audited.

3. Build the candidate ledger and classify every difference conservatively.

   For a general model refresh, add only primary LLM/chat/reasoning models. Do not add derived or specialized non-LLM variants just because the provider docs list them, such as TTS, STT, transcription, audio, image, video, realtime, moderation, or batch-only model IDs (`gpt-4o-transcribe`, `gpt-4o-mini-tts`, and similar). Also skip open-weight/checkpoint style IDs that encode parameter scale or architecture details when the provider has productized main model IDs, such as Qwen `qwen3.6-27b`, `qwen3.5-397b-a17b`, `qwen3.5-122b-a10b`, or `qwen3.5-35b-a3b`; prefer `max`, `plus`, `flash`, or other documented main product model IDs instead. Handle those only when the user explicitly asks for that modality/model class or when the provider itself is a modality-specific or open-model provider already maintained for that type.

   Transcribe exact official model IDs into `candidateModelIds`; do not rely on prose such as "latest models checked." Compare that list mechanically with the local inventory. Add a preset when an official source lists an in-scope model that is absent locally and it belongs to an existing provider. Clone the closest existing preset in the same provider and family, then adjust context, output limit, vision, reasoning, tool calling, response-format, and field-map fields from official docs or the closest local pattern. When the new model is newer or more capable than its clone source, set `insertBefore` to the existing model that it must precede; cloning and display placement are separate decisions.

   If a missing candidate is intentionally excluded by the scope rules, put it in `skip` with its exact model ID and a specific reason. The plan is incomplete while any missing candidate is neither added nor skipped.

   Keep every existing preset. Deprecated, retired, unavailable, superseded, preview, experimental, and dated candidate IDs may be noted in the audit summary, but must not be removed by this workflow.

4. Create and apply an update plan.

   For a full refresh, generate the all-provider template without `--provider`, then fill the audit evidence and confirmed additions. Keep every `remove` array empty:

   ```bash
   node .codex/skills/model-provider-updater/scripts/model_provider_presets.mjs plan-template > /tmp/model-provider-plan.json
   ```

   For an explicitly scoped request, `plan-template --provider OpenAI` and `apply-plan --allow-partial` are allowed. The template pre-populates the configured official `sources`; do not delete an unvisited source to bypass checking it.

   Dry-run before writing:

   ```bash
   node .codex/skills/model-provider-updater/scripts/model_provider_presets.mjs apply-plan --plan /tmp/model-provider-plan.json --dry-run
   node .codex/skills/model-provider-updater/scripts/model_provider_presets.mjs apply-plan --plan /tmp/model-provider-plan.json --write
   ```

   The plan format is documented in `references/plan.example.json`. That file includes an intentionally unregistered `ExampleProvider` shape example, so use `plan-template` for executable plans instead of applying the example file directly. Keep every audited provider in the plan:
   - Use `auditStatus: "checked"` with empty `add` and `remove` when the provider was checked and no registry change is needed.
   - Use `auditStatus: "changed"` when adding presets.
   - `auditStatus: "pending"` is template state only and cannot be applied.
   - Fill `catalogStatus`, `auditNote`, `candidateModelIds`, and `skip` for every provider, even when nothing changes.

   `replace` supports top-level provider-model fields only, such as `maxContext`, `maxTokens`, `vision`, `reasoning`, `responseFormatList`, or `fieldMap`. Do not use dotted paths such as `fieldMap.max_tokens`; replace the full top-level object instead.

   `insertBefore` accepts an exact existing model ID and places the cloned addition before it. Use it to preserve newest-or-most-capable-first ordering; otherwise additions are inserted after `cloneFrom` for backward compatibility.

   The script only edits providers registered by `packages/infrastructure/src/static-data/models/index.ts`, validates the whole plan before writing any file, and errors on incomplete provider coverage, unchecked configured sources, pending states, missing audit notes, duplicate IDs, unaccounted catalog candidates, or missing addition evidence. Although the script can mechanically process removals for legacy workflows, this skill must always submit empty `remove` arrays.

5. Validate.

   ```bash
   bun run test
   bun tsc --noEmit
   ```

   If the full suite is too broad for the change, run the model inventory plus targeted TypeScript validation and state the skipped coverage clearly.

## Evidence Rules

- Record every official source URL checked, the check date, catalog status, exact candidate model IDs, and an audit note for every provider, including providers with no changes.
- Do not mark a provider checked until all configured source URLs have been inspected and every missing candidate has an `add` or reasoned `skip` disposition.
- Treat model catalogs and release notes as complementary evidence. If they conflict because a release is newer than the catalog page, use the newer official release/model page and record the discrepancy in `auditNote`.
- Do not add removal entries to the plan. Record retirement or deprecation findings only in the run summary when they materially affect users.
- Prefer primary API references over marketing pages when fields disagree.
- When official docs group many modality-specific variants under one family, treat the main public chat/LLM model as the preset target and skip derivative IDs unless the request names that capability.
- When official docs list both provider-hosted main model IDs and open-weight/checkpoint IDs in one table, target the main hosted IDs and skip parameter-scale checkpoint IDs unless the user explicitly asks to support open-source model names.
- Treat aliases such as `*-latest` as stable presets only if the provider documents them as public model IDs.
- Keep existing ordering style inside each provider file: newest or most capable models first when that is already the local pattern.
- Preserve local compatibility fields unless official docs prove they are wrong.

## Helper Script

`scripts/model_provider_presets.mjs` supports:

- `inventory`: list registered providers, provider files, model counts, and type counts.
- `plan-template`: create a JSON update plan skeleton for all or selected providers.
- `apply-plan`: validate complete provider/source/candidate coverage and mechanically apply cloned additions. Its legacy removal capability is out of scope for this skill.
- `check-sources`: sanity-check source hint URLs from `references/provider_sources.json`.

Use the script for repeatable mechanics, then review the diff manually before final validation.
