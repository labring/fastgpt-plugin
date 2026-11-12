import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'model_provider_presets.mjs');
const tempDir = mkdtempSync(join(tmpdir(), 'model-provider-presets-test-'));
const today = localDateString();

after(() => rmSync(tempDir, { recursive: true, force: true }));

function run(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8'
  });
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function writePlan(name, providerPlan) {
  const path = join(tempDir, `${name}.json`);
  writeFileSync(path, JSON.stringify({ providers: { Gemini: providerPlan } }, null, 2));
  return path;
}

function geminiPlan(overrides = {}) {
  return {
    sources: [
      'https://ai.google.dev/gemini-api/docs/models',
      'https://ai.google.dev/gemini-api/docs/changelog',
      'https://ai.google.dev/gemini-api/docs/deprecations',
      'https://ai.google.dev/gemini-api/docs/pricing'
    ],
    checkedAt: today,
    auditStatus: 'checked',
    catalogStatus: 'reviewed',
    auditNote: 'Checked every configured official source and reconciled exact primary model IDs.',
    candidateModelIds: ['gemini-3.7-flash'],
    skip: [],
    add: [],
    remove: [],
    ...overrides
  };
}

test('complete audits reject a plan that omits allowlisted providers', () => {
  const plan = writePlan('partial', geminiPlan());
  const result = run(['apply-plan', '--plan', plan, '--dry-run']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Complete audit required/);
});

test('an allowlisted-provider plan can prove complete audit coverage', () => {
  const templateResult = run(['plan-template']);
  assert.equal(templateResult.status, 0, templateResult.stderr);
  const inventoryResult = run(['inventory', '--json']);
  assert.equal(inventoryResult.status, 0, inventoryResult.stderr);

  const plan = JSON.parse(templateResult.stdout);
  const inventory = JSON.parse(inventoryResult.stdout);
  for (const provider of inventory.providers.filter((item) => item.auditScope === 'included')) {
    const providerPlan = plan.providers[provider.provider];
    providerPlan.auditStatus = 'checked';
    providerPlan.auditNote = 'Test audit reconciled every exact candidate with the local inventory.';
    if (provider.modelIds.length > 0) {
      providerPlan.catalogStatus = 'reviewed';
      providerPlan.candidateModelIds = [...new Set(provider.modelIds)];
    } else if (providerPlan.sources.length > 0) {
      providerPlan.catalogStatus = 'no-in-scope-models';
    } else {
      providerPlan.catalogStatus = 'no-authoritative-catalog';
    }
  }

  const planPath = join(tempDir, 'complete.json');
  writeFileSync(planPath, JSON.stringify(plan, null, 2));
  const result = run(['apply-plan', '--plan', planPath, '--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  const count = Object.keys(plan.providers).length;
  assert.ok(result.stdout.includes(`${count}/${count} allowlisted providers audited`));
});

test('explicit partial audits accept fully evidenced checked providers', () => {
  const plan = writePlan('valid-partial', geminiPlan());
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.equal(result.status, 0, result.stderr);
  const count = Object.keys(JSON.parse(run(['plan-template']).stdout).providers).length;
  assert.ok(result.stdout.includes(`1/${count} allowlisted providers audited, partial mode`));
});

test('pending providers cannot be marked complete by apply-plan', () => {
  const plan = writePlan('pending', geminiPlan({ auditStatus: 'pending' }));
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /auditStatus is pending/);
});

test('every configured official source must be checked', () => {
  const plan = writePlan('missing-source', geminiPlan({ sources: ['https://ai.google.dev/gemini-api/docs/models'] }));
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /configured official source\(s\) were not checked/);
});

test('a missing catalog candidate must be added or explicitly skipped', () => {
  const plan = writePlan(
    'unaccounted-candidate',
    geminiPlan({ candidateModelIds: ['gemini-3.7-flash', 'gemini-future-test-model'] })
  );
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unaccounted catalog candidate gemini-future-test-model/);
});

test('a reasoned skip closes the catalog diff', () => {
  const plan = writePlan(
    'skipped-candidate',
    geminiPlan({
      candidateModelIds: ['gemini-3.7-flash', 'gemini-future-test-model'],
      skip: [
        {
          model: 'gemini-future-test-model',
          reason: 'Explicit test-only scope exclusion.'
        }
      ]
    })
  );
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.equal(result.status, 0, result.stderr);
});

test('a candidate cannot be both added and skipped', () => {
  const plan = writePlan(
    'conflicting-disposition',
    geminiPlan({
      auditStatus: 'changed',
      candidateModelIds: ['gemini-3.7-flash', 'gemini-future-test-model'],
      add: [
        {
          model: 'gemini-future-test-model',
          cloneFrom: 'gemini-3.7-flash',
          reason: 'Official release.'
        }
      ],
      skip: [{ model: 'gemini-future-test-model', reason: 'Conflicting test disposition.' }]
    })
  );
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot appear in both add and skip/);
});

test('insertBefore separates clone source from display placement', () => {
  const repoRoot = join(tempDir, 'placement-repo');
  const providerDir = join(repoRoot, 'packages/infrastructure/src/static-data/models/provider/Gemini');
  mkdirSync(providerDir, { recursive: true });
  writeFileSync(
    join(repoRoot, 'packages/infrastructure/src/static-data/models/index.ts'),
    "import gemini from './provider/Gemini';\n\nexport default [gemini];\n"
  );
  writeFileSync(
    join(providerDir, 'index.ts'),
    "const models = { provider: 'Gemini', list: [\n  { model: 'gemini-3.7-flash', maxTokens: 65536 }\n] };\nexport default models;\n"
  );
  const plan = writePlan(
    'insert-before',
    geminiPlan({
      auditStatus: 'changed',
      candidateModelIds: ['gemini-3.7-flash', 'gemini-future-test-model'],
      add: [
        {
          model: 'gemini-future-test-model',
          cloneFrom: 'gemini-3.7-flash',
          insertBefore: 'gemini-3.7-flash',
          reason: 'Synthetic newer model for placement testing.'
        }
      ]
    })
  );

  const result = run(['apply-plan', '--repo-root', repoRoot, '--plan', plan, '--write']);
  assert.equal(result.status, 0, result.stderr);
  const providerFile = readFileSync(join(providerDir, 'index.ts'), 'utf8');
  assert.ok(providerFile.indexOf('gemini-future-test-model') < providerFile.indexOf('gemini-3.7-flash'));
});

test('inventory exposes exclusions and template exactly follows the checked-in allowlist', () => {
  const inventory = JSON.parse(run(['inventory', '--json']).stdout).providers;
  const template = JSON.parse(run(['plan-template']).stdout).providers;
  const allowlist = JSON.parse(readFileSync(join(dirname(scriptPath), '../references/provider_allowlist.json'), 'utf8')).providers;
  assert.deepEqual(Object.keys(template).sort(), Object.keys(allowlist).sort());
  for (const provider of inventory) {
    assert.equal(provider.auditScope, Object.hasOwn(allowlist, provider.provider) ? 'included' : 'excluded');
  }
  assert.equal(inventory.find((item) => item.provider === 'OpenRouter').auditScope, 'excluded');
  assert.equal(inventory.find((item) => item.provider === 'Baichuan').auditScope, 'excluded');
});

test('excluded providers cannot be audited through scoped commands or partial plans', () => {
  for (const command of ['plan-template', 'check-sources']) {
    const result = run([command, '--provider', 'OpenRouter']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /outside the audit allowlist/);
  }
  const planPath = join(tempDir, 'excluded.json');
  writeFileSync(planPath, JSON.stringify({ providers: { OpenRouter: geminiPlan() } }));
  const result = run(['apply-plan', '--plan', planPath, '--write', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /outside the audit allowlist/);
});

test('unknown scoped provider names fail instead of producing empty success', () => {
  const result = run(['plan-template', '--provider', 'UnknownVendor']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown registered provider/);
});
