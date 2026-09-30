import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

export const OVERSEAS_PROVIDERS: Record<string, { prefix: string; dir: string }> = {
  OpenAI: { prefix: 'openai/', dir: 'OpenAI' },
  Claude: { prefix: 'anthropic/', dir: 'Claude' },
  Gemini: { prefix: 'google/', dir: 'Gemini' },
  Grok: { prefix: 'x-ai/', dir: 'Grok' },
  MistralAI: { prefix: 'mistralai/', dir: 'MistralAI' }
};

export interface OpenRouterModel {
  id: string;
  canonical_slug?: string | null;
  name?: string;
  description?: string;
  expiration_date?: string | null;
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    overrides?: Array<{
      min_prompt_tokens?: number;
      prompt?: string;
      completion?: string;
    }>;
  };
  supported_parameters?: string[];
  reasoning?: {
    mandatory?: boolean;
    supported_efforts?: string[];
  };
}

export interface PriceTier {
  minInputTokens?: number;
  maxInputTokens?: number | null;
  inputPrice: number;
  outputPrice: number;
}

const PRICE_CURRENCY = 'CNY' as const;
const TOKEN_BILLING_UNIT = 'tokens_per_1m' as const;

export function parseArgs() {
  const argv = process.argv.slice(2);
  const options = {
    apply: false,
    syncMetadata: false,
    pruneDeprecated: true,
    providers: Object.keys(OVERSEAS_PROVIDERS),
    exchangeRate: 7.0
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: pnpm tsx scripts/sync-openrouter-models.ts [options]

Options:
  --apply, --write      Apply price updates and remove deprecated models
  --no-prune            Do not remove deprecated models when applying
  --sync-metadata       Also synchronize maxContext and maxTokens from OpenRouter
  --provider=<names>    Comma-separated providers (e.g. OpenAI,Claude,Gemini,Grok,MistralAI)
  --rate=<number>       USD to CNY exchange rate (default: 7.0)
  --help, -h            Show this help message
`);
      process.exit(0);
    }
    if (arg === '--apply' || arg === '--write') {
      options.apply = true;
    } else if (arg === '--no-prune') {
      options.pruneDeprecated = false;
    } else if (arg === '--sync-metadata') {
      options.syncMetadata = true;
    } else if (arg.startsWith('--provider=')) {
      options.providers = arg
        .slice('--provider='.length)
        .split(',')
        .map((s) => s.trim());
    } else if (arg.startsWith('--rate=')) {
      options.exchangeRate = parseFloat(arg.slice('--rate='.length));
    }
  }

  return options;
}

export function calculatePriceTiers(model: OpenRouterModel, rate: number): PriceTier[] {
  const toRmb = (val?: string) => {
    if (!val) return 0;
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    const rmb = num * 1_000_000 * rate;
    return Math.round(rmb * 1000) / 1000;
  };

  const baseInput = toRmb(model.pricing?.prompt);
  const baseOutput = toRmb(model.pricing?.completion);

  if (model.pricing?.overrides && model.pricing.overrides.length > 0) {
    const tiers: PriceTier[] = [];
    const firstOverride = model.pricing.overrides[0];
    const threshold = firstOverride.min_prompt_tokens || 200000;

    tiers.push({
      maxInputTokens: threshold,
      inputPrice: baseInput,
      outputPrice: baseOutput
    });

    for (const ov of model.pricing.overrides) {
      tiers.push({
        minInputTokens: ov.min_prompt_tokens || threshold,
        inputPrice: toRmb(ov.prompt),
        outputPrice: toRmb(ov.completion)
      });
    }
    return tiers;
  }

  return [{ inputPrice: baseInput, outputPrice: baseOutput }];
}

export function normalizeId(id: string): string {
  return id.toLowerCase().replace(/\./g, '-');
}

export function matchOpenRouterModel(
  localModelId: string,
  orModels: OpenRouterModel[]
): OpenRouterModel | undefined {
  const normLocal = normalizeId(localModelId);

  // 1. Exact match on id after prefix
  const exact = orModels.find((m) => m.id.split('/')[1] === localModelId);
  if (exact) return exact;

  // 2. Normalized match (replace . with -)
  const normMatch = orModels.find((m) => normalizeId(m.id.split('/')[1]) === normLocal);
  if (normMatch) return normMatch;

  // 3. Canonical slug match
  const slugMatch = orModels.find((m) => {
    if (!m.canonical_slug) return false;
    const slug = m.canonical_slug.split('/')[1];
    return slug === localModelId || normalizeId(slug) === normLocal;
  });
  if (slugMatch) return slugMatch;

  // 4. Anthropic slug reordering:
  // e.g. local: claude-sonnet-4-6-20260217 vs OpenRouter: claude-4.6-sonnet-20260217
  const anthropicMatch = orModels.find((m) => {
    const slug = normalizeId((m.canonical_slug || m.id).split('/')[1]);
    const swapped = slug.replace(/^claude-(\d+-\d+)-([a-z]+)/, 'claude-$2-$1');
    return swapped === normLocal;
  });
  if (anthropicMatch) return anthropicMatch;

  return undefined;
}

function formatTier(tier: PriceTier): string {
  const parts: string[] = [];
  if (tier.minInputTokens !== undefined) {
    parts.push(`minInputTokens: ${tier.minInputTokens}`);
  }
  if (tier.maxInputTokens !== undefined) {
    parts.push(`maxInputTokens: ${tier.maxInputTokens}`);
  }
  parts.push(`inputPrice: ${tier.inputPrice}`);
  parts.push(`outputPrice: ${tier.outputPrice}`);
  return `{ ${parts.join(', ')} }`;
}

function formatTiers(tiers: PriceTier[]): string {
  if (tiers.length === 1) {
    return `[${formatTier(tiers[0])}]`;
  }
  return `[\n        ${tiers.map(formatTier).join(',\n        ')}\n      ]`;
}

export function isModelDeprecated(orModel?: OpenRouterModel): boolean {
  if (!orModel) return false;
  const name = orModel.name || '';
  const desc = orModel.description || '';
  if (/\((?:older|retired|deprecated)[^)]*\)/i.test(name)) return true;
  if (/\b(?:deprecated|retired|shut down|no longer supported)\b/i.test(name)) return true;
  if (/\b(?:deprecated|retired|shut down|end-of-life)\b/i.test(desc)) return true;
  if (orModel.expiration_date) {
    const exp = new Date(orModel.expiration_date);
    if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return true;
    }
  }
  return false;
}

export function getRemovalBounds(
  content: string,
  elem: ts.Node,
  sourceFile: ts.SourceFile
): { pos: number; end: number } {
  let removeStart = elem.getStart(sourceFile);
  let removeEnd = elem.end;
  while (removeEnd < content.length && /\s/.test(content[removeEnd])) {
    removeEnd++;
  }
  if (content[removeEnd] === ',') {
    removeEnd++;
    while (
      removeEnd < content.length &&
      (content[removeEnd] === ' ' || content[removeEnd] === '\t')
    ) {
      removeEnd++;
    }
    if (content[removeEnd] === '\n') {
      removeEnd++;
    }
  } else {
    let cursor = removeStart - 1;
    while (cursor >= 0 && /\s/.test(content[cursor])) {
      cursor--;
    }
    if (content[cursor] === ',') {
      removeStart = cursor;
    }
  }
  return { pos: removeStart, end: removeEnd };
}

export async function syncOverseasModels() {
  const options = parseArgs();
  console.log('Fetching models from https://openrouter.ai/api/v1/models...');
  const response = await fetch('https://openrouter.ai/api/v1/models');
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenRouter models: ${response.statusText}`);
  }
  const { data: allModels }: { data: OpenRouterModel[] } = await response.json();
  console.log(`Fetched ${allModels.length} models total from OpenRouter.\n`);

  const providerBaseDir = 'packages/infrastructure/src/static-data/models/provider';
  let totalMatched = 0;
  let totalChanges = 0;
  let totalDeprecated = 0;
  const modifiedFiles: string[] = [];

  for (const providerName of options.providers) {
    const config = OVERSEAS_PROVIDERS[providerName];
    if (!config) {
      console.warn(`Skipping unknown provider: ${providerName}`);
      continue;
    }

    const filePath = path.join(providerBaseDir, config.dir, 'index.ts');
    if (!fs.existsSync(filePath)) {
      console.warn(`Provider file not found: ${filePath}`);
      continue;
    }

    const orModels = allModels.filter(
      (m) => m.id.startsWith(config.prefix) && !m.id.endsWith(':batch') && !m.id.endsWith(':free')
    );

    let content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    let listNode: ts.ArrayLiteralExpression | null = null;
    function visit(node: ts.Node) {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'list' &&
        ts.isArrayLiteralExpression(node.initializer)
      ) {
        listNode = node.initializer;
        return;
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);

    if (!listNode) {
      console.warn(`Could not find 'list' array in ${filePath}`);
      continue;
    }

    console.log('============================================================');
    console.log(
      `Provider: ${providerName} (${(listNode as ts.ArrayLiteralExpression).elements.length} local models, ${orModels.length} in OpenRouter)`
    );
    console.log('============================================================');

    const matchedOrIds = new Set<string>();
    const updates: {
      modelId: string;
      pos: number;
      end: number;
      newText: string;
      diffSummary: string[];
      isRemoval?: boolean;
    }[] = [];

    for (const elem of (listNode as ts.ArrayLiteralExpression).elements) {
      if (!ts.isObjectLiteralExpression(elem)) continue;

      let modelId: string | null = null;
      let typeProp: ts.PropertyAssignment | null = null;
      let priceCurrencyProp: ts.PropertyAssignment | null = null;
      let billingUnitProp: ts.PropertyAssignment | null = null;
      let priceTiersProp: ts.PropertyAssignment | null = null;
      let maxContextProp: ts.PropertyAssignment | null = null;
      let maxTokensProp: ts.PropertyAssignment | null = null;
      let visionProp: ts.PropertyAssignment | null = null;
      let modelProp: ts.PropertyAssignment | null = null;

      for (const prop of elem.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name.getText(sourceFile).replace(/['"]/g, '');
        if (name === 'type') {
          typeProp = prop;
        } else if (name === 'priceCurrency') {
          priceCurrencyProp = prop;
        } else if (name === 'billingUnit') {
          billingUnitProp = prop;
        } else if (name === 'model' && ts.isStringLiteral(prop.initializer)) {
          modelId = prop.initializer.text;
          modelProp = prop;
        } else if (name === 'priceTiers') {
          priceTiersProp = prop;
        } else if (name === 'maxContext') {
          maxContextProp = prop;
        } else if (name === 'maxTokens') {
          maxTokensProp = prop;
        } else if (name === 'vision') {
          visionProp = prop;
        }
      }

      if (!modelId || !modelProp) continue;

      const orMatch = matchOpenRouterModel(modelId, orModels);
      if (!orMatch) {
        continue;
      }

      matchedOrIds.add(orMatch.id);
      totalMatched++;

      if (isModelDeprecated(orMatch)) {
        totalChanges++;
        totalDeprecated++;
        console.log(
          `  ✗ ${modelId} (matches ${orMatch.id}): marked as DEPRECATED (${orMatch.name || 'retired'})`
        );
        if (options.pruneDeprecated) {
          const bounds = getRemovalBounds(content, elem, sourceFile);
          updates.push({
            modelId,
            pos: bounds.pos,
            end: bounds.end,
            newText: '',
            diffSummary: [`deprecated: remove model ${modelId}`],
            isRemoval: true
          });
        }
        continue;
      }

      const diffSummary: string[] = [];
      const infoSummary: string[] = [];
      const metadataUpdates: typeof updates = [];
      const missingMetadata: string[] = [];

      if (priceCurrencyProp) {
        const oldCurrency = priceCurrencyProp.initializer.getText(sourceFile).replace(/["']/g, '');
        if (oldCurrency !== PRICE_CURRENCY) {
          diffSummary.push(`priceCurrency: ${oldCurrency} -> ${PRICE_CURRENCY}`);
          metadataUpdates.push({
            modelId,
            pos: priceCurrencyProp.getStart(sourceFile),
            end: priceCurrencyProp.end,
            newText: `priceCurrency: '${PRICE_CURRENCY}'`,
            diffSummary: [`priceCurrency: ${oldCurrency} -> ${PRICE_CURRENCY}`]
          });
        }
      } else {
        diffSummary.push(`priceCurrency: missing -> ${PRICE_CURRENCY}`);
        missingMetadata.push(`priceCurrency: '${PRICE_CURRENCY}'`);
      }

      if (billingUnitProp) {
        const oldBillingUnit = billingUnitProp.initializer
          .getText(sourceFile)
          .replace(/["']/g, '');
        if (oldBillingUnit !== TOKEN_BILLING_UNIT) {
          diffSummary.push(`billingUnit: ${oldBillingUnit} -> ${TOKEN_BILLING_UNIT}`);
          metadataUpdates.push({
            modelId,
            pos: billingUnitProp.getStart(sourceFile),
            end: billingUnitProp.end,
            newText: `billingUnit: '${TOKEN_BILLING_UNIT}'`,
            diffSummary: [`billingUnit: ${oldBillingUnit} -> ${TOKEN_BILLING_UNIT}`]
          });
        }
      } else {
        diffSummary.push(`billingUnit: missing -> ${TOKEN_BILLING_UNIT}`);
        missingMetadata.push(`billingUnit: '${TOKEN_BILLING_UNIT}'`);
      }

      if (missingMetadata.length > 0 && typeProp) {
        const anchor = priceCurrencyProp ?? typeProp;
        metadataUpdates.push({
          modelId,
          pos: anchor.end,
          end: anchor.end,
          // PropertyAssignment.end is before the existing comma. Prefixing a comma
          // keeps the anchor valid whether it was the last property or not.
          newText: `,\n    ${missingMetadata.join(',\n    ')}`,
          diffSummary: missingMetadata
        });
      }

      const newTiers = calculatePriceTiers(orMatch, options.exchangeRate);
      const newTiersStr = formatTiers(newTiers);

      let priceChanged = false;
      if (priceTiersProp) {
        const oldTiersText = priceTiersProp.initializer.getText(sourceFile).replace(/\s+/g, ' ');
        const compactNewText = newTiersStr.replace(/\s+/g, ' ');
        if (oldTiersText !== compactNewText) {
          diffSummary.push(`priceTiers: ${oldTiersText} -> ${compactNewText}`);
          priceChanged = true;
        }
      } else {
        diffSummary.push(`priceTiers: missing -> ${newTiersStr.replace(/\s+/g, ' ')}`);
        priceChanged = true;
      }

      if (maxContextProp && orMatch.context_length && orMatch.context_length > 0) {
        const oldCtx = parseInt(maxContextProp.initializer.getText(sourceFile), 10);
        if (oldCtx !== orMatch.context_length) {
          if (options.syncMetadata) {
            diffSummary.push(`maxContext: ${oldCtx} -> ${orMatch.context_length}`);
            updates.push({
              modelId,
              pos: maxContextProp.getStart(sourceFile),
              end: maxContextProp.end,
              newText: `maxContext: ${orMatch.context_length}`,
              diffSummary: [`maxContext: ${oldCtx} -> ${orMatch.context_length}`]
            });
          } else {
            infoSummary.push(`maxContext: ${oldCtx} -> ${orMatch.context_length}`);
          }
        }
      }

      if (maxTokensProp && orMatch.top_provider?.max_completion_tokens) {
        const oldMaxTokens = parseInt(maxTokensProp.initializer.getText(sourceFile), 10);
        if (oldMaxTokens !== orMatch.top_provider.max_completion_tokens) {
          if (options.syncMetadata) {
            diffSummary.push(
              `maxTokens: ${oldMaxTokens} -> ${orMatch.top_provider.max_completion_tokens}`
            );
            updates.push({
              modelId,
              pos: maxTokensProp.getStart(sourceFile),
              end: maxTokensProp.end,
              newText: `maxTokens: ${orMatch.top_provider.max_completion_tokens}`,
              diffSummary: [`maxTokens: ${oldMaxTokens} -> ${orMatch.top_provider.max_completion_tokens}`]
            });
          } else {
            infoSummary.push(`maxTokens: ${oldMaxTokens} -> ${orMatch.top_provider.max_completion_tokens}`);
          }
        }
      }

      const orHasVision = orMatch.architecture?.input_modalities?.includes('image') ?? false;
      if (visionProp) {
        const oldVision = visionProp.initializer.getText(sourceFile) === 'true';
        if (oldVision !== orHasVision) {
          infoSummary.push(`vision: ${oldVision} -> ${orHasVision}`);
        }
      }

      if (diffSummary.length > 0) {
        totalChanges++;
        console.log(`  ✓ ${modelId} (matches ${orMatch.id}):`);
        for (const diff of diffSummary) {
          console.log(`      • ${diff}`);
        }

        updates.push(...metadataUpdates);

        if (priceChanged && priceTiersProp) {
          updates.push({
            modelId,
            pos: priceTiersProp.getStart(sourceFile),
            end: priceTiersProp.end,
            newText: `priceTiers: ${newTiersStr}`,
            diffSummary
          });
        } else if (priceChanged && modelProp) {
          updates.push({
            modelId,
            pos: modelProp.end,
            end: modelProp.end,
            newText: `,\n    priceTiers: ${newTiersStr}`,
            diffSummary
          });
        }
      } else if (infoSummary.length > 0) {
        console.log(
          `  - ${modelId} (matches ${orMatch.id}): price up-to-date [info: ${infoSummary.join(', ')}]`,
        );
      } else {
        console.log(`  - ${modelId} (matches ${orMatch.id}): up-to-date`);
      }
    }

    if (options.apply && updates.length > 0) {
      updates.sort((a, b) => b.pos - a.pos);
      for (const u of updates) {
        content = content.slice(0, u.pos) + u.newText + content.slice(u.end);
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedFiles.push(filePath);
      const appliedRemovals = updates.filter((u) => u.isRemoval).length;
      const appliedModifications = updates.length - appliedRemovals;
      console.log(
        `\n  Updated ${filePath} (${appliedModifications} modified, ${appliedRemovals} deprecated removed)`,
      );
    }

    const newCandidates = orModels.filter((m) => {
      if (matchedOrIds.has(m.id)) return false;
      if (isModelDeprecated(m)) return false;
      if (/(?:-0613|-0314|-1106|-1105|-0125|-0806|-0718)/.test(m.id)) return false;
      if (/-(?:2023|2024)\d{4}/.test(m.id)) return false;
      return true;
    });
    if (newCandidates.length > 0) {
      console.log(`\n  [Discovered ${newCandidates.length} potential new models on OpenRouter]:`);
      for (const m of newCandidates.slice(0, 8)) {
        const pRmb = (parseFloat(m.pricing?.prompt || '0') * 7e6).toFixed(2);
        const cRmb = (parseFloat(m.pricing?.completion || '0') * 7e6).toFixed(2);
        console.log(`    + ${m.id} (ctx: ${m.context_length}, price: [${pRmb}, ${cRmb}])`);
      }
      if (newCandidates.length > 8) {
        console.log(`    ...and ${newCandidates.length - 8} more`);
      }
    }
    console.log();
  }

  if (options.apply && modifiedFiles.length > 0) {
    console.log('Running eslint --fix on modified files...');
    try {
      execSync(`pnpm lint ${modifiedFiles.join(' ')}`, { stdio: 'inherit' });
    } catch {
      // eslint warnings may exit with non-zero or handled
    }
  }

  console.log(
    `Done! Scanned ${options.providers.length} overseas providers, matched ${totalMatched} models, ${totalChanges} models with updates/removals (${totalDeprecated} deprecated).`
  );
  if (!options.apply && totalChanges > 0) {
    console.log('Run with --apply to write changes to provider files.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncOverseasModels().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
