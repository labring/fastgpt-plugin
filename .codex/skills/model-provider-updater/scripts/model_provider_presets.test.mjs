import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

test('complete audits reject a plan that omits registered providers', () => {
  const plan = writePlan('partial', geminiPlan());
  const result = run(['apply-plan', '--plan', plan, '--dry-run']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Complete audit required/);
});

test('an all-provider plan can prove complete registry coverage', () => {
  const templateResult = run(['plan-template']);
  assert.equal(templateResult.status, 0, templateResult.stderr);
  const inventoryResult = run(['inventory', '--json']);
  assert.equal(inventoryResult.status, 0, inventoryResult.stderr);

  const plan = JSON.parse(templateResult.stdout);
  const inventory = JSON.parse(inventoryResult.stdout);
  for (const provider of inventory.providers) {
    const providerPlan = plan.providers[provider.provider];
    providerPlan.auditStatus = 'checked';
    providerPlan.auditNote = 'Test audit reconciled every exact candidate with the local inventory.';
    if (provider.modelIds.length > 0) {
      providerPlan.catalogStatus = 'reviewed';
      providerPlan.candidateModelIds = provider.modelIds;
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
  assert.match(result.stdout, /34\/34 providers audited/);
});

test('explicit partial audits accept fully evidenced checked providers', () => {
  const plan = writePlan('valid-partial', geminiPlan());
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1\/34 providers audited, partial mode/);
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
    geminiPlan({ candidateModelIds: ['gemini-3.7-flash', 'gemini-3.8-flash'] })
  );
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unaccounted catalog candidate gemini-3\.8-flash/);
});

test('a reasoned skip closes the catalog diff', () => {
  const plan = writePlan(
    'skipped-candidate',
    geminiPlan({
      candidateModelIds: ['gemini-3.7-flash', 'gemini-3.8-flash'],
      skip: [
        {
          model: 'gemini-3.8-flash',
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
      candidateModelIds: ['gemini-3.7-flash', 'gemini-3.8-flash'],
      add: [
        {
          model: 'gemini-3.8-flash',
          cloneFrom: 'gemini-3.7-flash',
          reason: 'Official release.'
        }
      ],
      skip: [{ model: 'gemini-3.8-flash', reason: 'Conflicting test disposition.' }]
    })
  );
  const result = run(['apply-plan', '--plan', plan, '--dry-run', '--allow-partial']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot appear in both add and skip/);
});
