#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, '..');
const defaultRepoRoot = resolve(skillDir, '../../..');

const args = parseArgs(process.argv.slice(2));
const command = args._[0];

try {
  switch (command) {
    case 'inventory':
      commandInventory(args);
      break;
    case 'plan-template':
      commandPlanTemplate(args);
      break;
    case 'apply-plan':
      await commandApplyPlan(args);
      break;
    case 'check-sources':
      await commandCheckSources(args);
      break;
    default:
      printUsage();
      process.exit(command ? 1 : 0);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      parsed._.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      parsed[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function getRepoRoot(parsedArgs) {
  return resolve(String(parsedArgs['repo-root'] || process.env.FASTGPT_PLUGIN_REPO || defaultRepoRoot));
}

function getProviderRoot(repoRoot) {
  return join(repoRoot, 'modules/model/provider');
}

function getInitPath(repoRoot) {
  return join(repoRoot, 'modules/model/init.ts');
}

function commandInventory(parsedArgs) {
  const repoRoot = getRepoRoot(parsedArgs);
  const providers = getRegisteredProviders(repoRoot);
  const filtered = filterProviders(providers, parsedArgs.provider);
  const inventory = filtered.map((provider) => {
    const content = readFileSync(provider.filePath, 'utf8');
    const declaredProvider = readDeclaredProvider(content) || provider.dirName;
    const entries = readModelEntries(content);
    const typeCounts = {};
    for (const entry of entries) {
      typeCounts[entry.type || 'unknown'] = (typeCounts[entry.type || 'unknown'] || 0) + 1;
    }
    return {
      provider: declaredProvider,
      dirName: provider.dirName,
      file: relative(repoRoot, provider.filePath),
      models: entries.length,
      typeCounts,
      modelIds: entries.map((entry) => entry.model)
    };
  });

  if (parsedArgs.json) {
    console.log(JSON.stringify({ repoRoot, providers: inventory }, null, 2));
    return;
  }

  console.log(`Model provider inventory (${inventory.length} registered providers)`);
  for (const item of inventory) {
    const counts = Object.entries(item.typeCounts)
      .map(([type, count]) => `${type}:${count}`)
      .join(', ');
    console.log(`- ${item.provider} (${item.file}): ${item.models} models${counts ? ` [${counts}]` : ''}`);
  }
}

function commandPlanTemplate(parsedArgs) {
  const repoRoot = getRepoRoot(parsedArgs);
  const providers = filterProviders(getRegisteredProviders(repoRoot), parsedArgs.provider);
  const plan = { providers: {} };
  for (const provider of providers) {
    const content = readFileSync(provider.filePath, 'utf8');
    const declaredProvider = readDeclaredProvider(content) || provider.dirName;
    plan.providers[declaredProvider] = {
      source: '',
      checkedAt: todayDateString(),
      auditStatus: 'pending',
      add: [],
      remove: []
    };
  }
  console.log(JSON.stringify(plan, null, 2));
}

async function commandApplyPlan(parsedArgs) {
  const repoRoot = getRepoRoot(parsedArgs);
  const planPath = parsedArgs.plan ? resolve(String(parsedArgs.plan)) : '';
  if (!planPath) {
    throw new Error('apply-plan requires --plan <path>');
  }
  const write = Boolean(parsedArgs.write);
  if (!write && !parsedArgs['dry-run']) {
    throw new Error('apply-plan requires either --dry-run or --write');
  }

  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  const providerPlans = plan.providers || {};
  if (!isPlainObject(providerPlans)) {
    throw new Error('Plan must contain an object at providers');
  }
  const registeredProviders = getRegisteredProviders(repoRoot);
  const results = [];
  const pendingWrites = [];

  for (const [providerName, providerPlan] of Object.entries(providerPlans)) {
    const providerFile = resolveProviderFile(repoRoot, providerName, registeredProviders);
    const validatedPlan = validateProviderPlan(providerFile.provider, providerPlan);
    let content = readFileSync(providerFile.filePath, 'utf8');
    const before = content;
    const providerResults = [];

    for (const addition of validatedPlan.add) {
      const result = addModelEntry(content, addition);
      content = result.content;
      providerResults.push({
        action: 'add',
        model: addition.model,
        cloneFrom: addition.cloneFrom,
        status: result.status,
        reason: addition.reason
      });
    }

    for (const removal of validatedPlan.remove) {
      const result = removeModelEntry(content, removal.model);
      content = result.content;
      providerResults.push({
        action: 'remove',
        model: removal.model,
        status: result.removed ? 'removed' : 'not-found',
        reason: removal.reason
      });
    }

    const changed = content !== before;
    pendingWrites.push({ filePath: providerFile.filePath, content, changed });

    results.push({
      provider: providerFile.provider,
      file: relative(repoRoot, providerFile.filePath),
      changed,
      source: validatedPlan.source,
      checkedAt: validatedPlan.checkedAt,
      auditStatus: validatedPlan.auditStatus,
      operations: providerResults
    });
  }

  if (write) {
    for (const pendingWrite of pendingWrites) {
      if (pendingWrite.changed) {
        writeFileSync(pendingWrite.filePath, pendingWrite.content);
      }
    }
  }

  if (parsedArgs.json) {
    console.log(JSON.stringify({ mode: write ? 'write' : 'dry-run', results }, null, 2));
    return;
  }

  console.log(`apply-plan ${write ? 'write' : 'dry-run'} complete`);
  for (const result of results) {
    console.log(`- ${result.provider} (${result.file}): ${result.changed ? 'changed' : 'unchanged'}`);
    for (const operation of result.operations) {
      const clone = operation.cloneFrom ? ` from ${operation.cloneFrom}` : '';
      console.log(`  - ${operation.action} ${operation.model}${clone}: ${operation.status}`);
    }
  }
}

async function commandCheckSources(parsedArgs) {
  const repoRoot = getRepoRoot(parsedArgs);
  const providers = filterProviders(getRegisteredProviders(repoRoot), parsedArgs.provider);
  const sourcePath = join(skillDir, 'references/provider_sources.json');
  const sourceHints = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const results = [];
  const tasks = [];
  const concurrency = parsePositiveInteger(parsedArgs.concurrency, 4);

  for (const provider of providers) {
    const content = readFileSync(provider.filePath, 'utf8');
    const providerName = readDeclaredProvider(content) || provider.dirName;
    const hint = sourceHints[providerName] || sourceHints[provider.dirName] || {};
    const docs = Array.isArray(hint.docs) ? hint.docs : [];
    if (docs.length === 0) {
      results.push({ provider: providerName, url: '', ok: false, status: 'missing-source-hint' });
      continue;
    }
    for (const url of docs) {
      tasks.push({ provider: providerName, url });
    }
  }

  const checked = await mapLimit(tasks, concurrency, async (task, index) => {
    if (!parsedArgs.json) {
      console.error(`[${index + 1}/${tasks.length}] checking ${task.provider}: ${task.url}`);
    }
    return { provider: task.provider, url: task.url, ...(await checkUrl(task.url)) };
  });
  results.push(...checked);

  if (parsedArgs.json) {
    console.log(JSON.stringify({ results }, null, 2));
  } else {
    console.log(`Source hint check (${tasks.length} URLs, concurrency ${concurrency})`);
    for (const result of results) {
      const target = result.url ? ` ${result.url}` : '';
      console.log(`- ${result.provider}:${target} -> ${result.status}${result.ok ? '' : ' (review)'}`);
    }
  }

  if (parsedArgs.strict && results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

async function checkUrl(url) {
  const headers = {
    accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
    'user-agent': 'FastGPT-model-provider-updater/1.0'
  };
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers,
      signal: AbortSignal.timeout(10000)
    });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers,
        signal: AbortSignal.timeout(10000)
      });
    }
    if (response.status === 403) {
      return { ok: true, status: '403-access-limited' };
    }
    return { ok: response.ok, status: String(response.status) };
  } catch (error) {
    return { ok: false, status: error instanceof Error ? error.message : String(error) };
  }
}

function getRegisteredProviders(repoRoot) {
  const initPath = getInitPath(repoRoot);
  if (!existsSync(initPath)) {
    throw new Error(`Missing model init file: ${initPath}`);
  }
  const initContent = readFileSync(initPath, 'utf8');
  const imports = [...initContent.matchAll(/^import\s+([A-Za-z_$][\w$]*)\s+from\s+'\.\/provider\/([^']+)';/gm)].map(
    (match) => ({
      alias: match[1],
      dirName: match[2],
      filePath: join(getProviderRoot(repoRoot), match[2], 'index.ts')
    })
  );
  return imports.filter((item) => existsSync(item.filePath));
}

function filterProviders(providers, providerFilter) {
  if (!providerFilter) return providers;
  const requested = new Set(String(providerFilter).split(',').map((item) => item.trim()).filter(Boolean));
  return providers.filter((provider) => {
    const content = readFileSync(provider.filePath, 'utf8');
    const declaredProvider = readDeclaredProvider(content) || provider.dirName;
    return requested.has(provider.dirName) || requested.has(declaredProvider);
  });
}

function resolveProviderFile(repoRoot, providerName, registeredProviders = getRegisteredProviders(repoRoot)) {
  for (const provider of registeredProviders) {
    const filePath = provider.filePath;
    const content = readFileSync(filePath, 'utf8');
    const declaredProvider = readDeclaredProvider(content) || provider.dirName;
    if (provider.dirName === providerName || declaredProvider === providerName) {
      return { provider: declaredProvider, dirName: provider.dirName, filePath };
    }
  }

  throw new Error(`Provider is not registered in modules/model/init.ts: ${providerName}`);
}

function readDeclaredProvider(content) {
  const match = content.match(/provider:\s*['"`]([^'"`]+)['"`]/);
  return match?.[1] || '';
}

function readModelEntries(content) {
  const arrayRange = findListArrayRange(content);
  if (!arrayRange) return [];
  const entries = [];
  let index = arrayRange.start + 1;
  while (index < arrayRange.end) {
    const char = content[index];
    if (char === '{') {
      const end = findMatching(content, index, '{', '}');
      const text = content.slice(index, end + 1);
      const model = text.match(/model:\s*(['"`])([^'"`]+)\1/)?.[2];
      const type = text.match(/type:\s*ModelTypeEnum\.([A-Za-z0-9_]+)/)?.[1];
      if (model) {
        entries.push({ model, type, start: index, end: end + 1, text });
      }
      index = end + 1;
    } else {
      index += 1;
    }
  }
  return entries;
}

function findListArrayRange(content) {
  const listIndex = content.indexOf('list:');
  if (listIndex === -1) return null;
  const start = content.indexOf('[', listIndex);
  if (start === -1) return null;
  const end = findMatching(content, start, '[', ']');
  return { start, end };
}

function findMatching(content, start, open, close) {
  let depth = 0;
  let stringQuote = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = start; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (stringQuote) {
      if (char === '\\') {
        i += 1;
      } else if (char === stringQuote) {
        stringQuote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      stringQuote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  throw new Error(`No matching ${close} found`);
}

function removeModelEntry(content, model) {
  const entry = readModelEntries(content).find((item) => item.model === model);
  if (!entry) return { content, removed: false };

  let removeStart = entry.start;
  let removeEnd = entry.end;
  while (content[removeEnd] && /\s/.test(content[removeEnd])) removeEnd += 1;
  if (content[removeEnd] === ',') {
    removeEnd += 1;
    if (content[removeEnd] === '\n') removeEnd += 1;
  } else {
    let cursor = removeStart - 1;
    while (cursor >= 0 && /\s/.test(content[cursor])) cursor -= 1;
    if (content[cursor] === ',') removeStart = cursor;
  }

  return { content: content.slice(0, removeStart) + content.slice(removeEnd), removed: true };
}

function addModelEntry(content, addition) {
  const entries = readModelEntries(content);
  if (entries.some((entry) => entry.model === addition.model)) {
    return { content, status: 'already-present' };
  }
  const source = entries.find((entry) => entry.model === addition.cloneFrom);
  if (!source) {
    throw new Error(`cloneFrom model not found: ${addition.cloneFrom}`);
  }

  let cloneText = source.text.replace(
    /(model:\s*)(['"`])([^'"`]+)(['"`])/,
    `$1$2${escapeReplacement(addition.model)}$4`
  );
  if (addition.replace && typeof addition.replace === 'object') {
    for (const [key, value] of Object.entries(addition.replace)) {
      cloneText = replaceSimpleProperty(cloneText, key, value);
    }
  }

  const lineStart = content.lastIndexOf('\n', source.start) + 1;
  const indent = content.slice(lineStart, source.start);
  const cursor = skipWhitespace(content, source.end);
  if (content[cursor] === ',') {
    const insertAt = cursor + 1;
    return {
      content: `${content.slice(0, insertAt)}\n${indent}${cloneText},${content.slice(insertAt)}`,
      status: 'added'
    };
  }

  return {
    content: `${content.slice(0, source.end)},\n${indent}${cloneText}${content.slice(source.end)}`,
    status: 'added'
  };
}

function replaceSimpleProperty(objectText, key, value) {
  if (!/^[A-Za-z_$][\w$]*$/.test(key)) {
    throw new Error(`replace key must be a top-level TypeScript identifier: ${key}`);
  }
  const literal = toTsLiteral(value);
  const property = findTopLevelProperty(objectText, key);
  if (property) {
    return `${objectText.slice(0, property.valueStart)}${literal}${objectText.slice(property.valueEnd)}`;
  }
  if (findNestedProperty(objectText, key)) {
    throw new Error(`replace key matched a nested property; replace the full top-level object instead: ${key}`);
  }
  return insertTopLevelProperty(objectText, key, literal);
}

function toTsLiteral(value) {
  if (typeof value === 'string') return `'${value.replaceAll("'", "\\'")}'`;
  if (value === null) return 'null';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function skipWhitespace(content, index) {
  let cursor = index;
  while (content[cursor] && /\s/.test(content[cursor])) cursor += 1;
  return cursor;
}

function escapeReplacement(value) {
  return String(value).replaceAll('$', '$$$$');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateProviderPlan(providerName, providerPlan) {
  if (!isPlainObject(providerPlan)) {
    throw new Error(`${providerName}: provider plan must be an object`);
  }
  const add = providerPlan.add === undefined ? [] : providerPlan.add;
  const remove = providerPlan.remove === undefined ? [] : providerPlan.remove;
  if (!Array.isArray(add)) {
    throw new Error(`${providerName}: add must be an array`);
  }
  if (!Array.isArray(remove)) {
    throw new Error(`${providerName}: remove must be an array`);
  }

  const hasChanges = add.length > 0 || remove.length > 0;
  const auditStatus = String(providerPlan.auditStatus || (hasChanges ? 'changed' : 'pending'));
  const source = typeof providerPlan.source === 'string' ? providerPlan.source.trim() : '';
  const checkedAt = typeof providerPlan.checkedAt === 'string' ? providerPlan.checkedAt.trim() : '';
  if (!['pending', 'checked', 'changed'].includes(auditStatus)) {
    throw new Error(`${providerName}: auditStatus must be pending, checked, or changed`);
  }
  if (hasChanges && auditStatus !== 'changed') {
    throw new Error(`${providerName}: auditStatus must be changed when add or remove is non-empty`);
  }
  if (!hasChanges && auditStatus === 'changed') {
    throw new Error(`${providerName}: auditStatus changed requires a non-empty add or remove list`);
  }
  if ((hasChanges || auditStatus === 'checked') && !source) {
    throw new Error(`${providerName}: source is required for changed or checked providers`);
  }
  if ((hasChanges || auditStatus === 'checked') && !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) {
    throw new Error(`${providerName}: checkedAt must use YYYY-MM-DD for changed or checked providers`);
  }

  return {
    source,
    checkedAt,
    auditStatus,
    add: add.map((addition, index) => validateAddition(providerName, addition, index)),
    remove: remove.map((removal, index) => validateRemoval(providerName, removal, index))
  };
}

function validateAddition(providerName, addition, index) {
  if (!isPlainObject(addition)) {
    throw new Error(`${providerName}: add[${index}] must be an object`);
  }
  if (!isNonEmptyString(addition.model)) {
    throw new Error(`${providerName}: add[${index}] is missing model`);
  }
  if (!isNonEmptyString(addition.cloneFrom)) {
    throw new Error(`${providerName}: add[${index}] is missing cloneFrom`);
  }
  if (!isNonEmptyString(addition.reason)) {
    throw new Error(`${providerName}: add[${index}] is missing reason`);
  }
  if (addition.replace !== undefined && !isPlainObject(addition.replace)) {
    throw new Error(`${providerName}: add[${index}].replace must be an object`);
  }
  for (const key of Object.keys(addition.replace || {})) {
    if (!/^[A-Za-z_$][\w$]*$/.test(key)) {
      throw new Error(`${providerName}: add[${index}].replace only supports top-level identifier keys: ${key}`);
    }
  }
  return addition;
}

function validateRemoval(providerName, removal, index) {
  if (typeof removal === 'string') {
    throw new Error(`${providerName}: remove[${index}] must be an object with model and reason`);
  }
  if (!isPlainObject(removal)) {
    throw new Error(`${providerName}: remove[${index}] must be an object`);
  }
  if (!isNonEmptyString(removal.model)) {
    throw new Error(`${providerName}: remove[${index}] is missing model`);
  }
  if (!isNonEmptyString(removal.reason)) {
    throw new Error(`${providerName}: remove[${index}] is missing reason`);
  }
  return removal;
}

function findTopLevelProperty(objectText, key) {
  let index = 0;
  while (index < objectText.length) {
    const match = findNextIdentifier(objectText, index, key);
    if (!match) return null;
    index = match.end;
    if (getObjectDepth(objectText, match.start) !== 1) continue;
    let cursor = skipWhitespace(objectText, match.end);
    if (objectText[cursor] !== ':') continue;
    cursor = skipWhitespace(objectText, cursor + 1);
    const valueEnd = findTopLevelValueEnd(objectText, cursor);
    return { valueStart: cursor, valueEnd };
  }
  return null;
}

function findNestedProperty(objectText, key) {
  let index = 0;
  while (index < objectText.length) {
    const match = findNextIdentifier(objectText, index, key);
    if (!match) return null;
    index = match.end;
    if (getObjectDepth(objectText, match.start) <= 1) continue;
    const cursor = skipWhitespace(objectText, match.end);
    if (objectText[cursor] === ':') return match;
  }
  return null;
}

function findNextIdentifier(text, from, key) {
  const pattern = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g');
  pattern.lastIndex = from;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const before = text[match.index - 1] || '';
    const after = text[match.index + key.length] || '';
    if (!/[\w$]/.test(before) && !/[\w$]/.test(after) && !isInsideStringOrComment(text, match.index)) {
      return { start: match.index, end: match.index + key.length };
    }
  }
  return null;
}

function findTopLevelValueEnd(objectText, valueStart) {
  let depth = 1;
  let stringQuote = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = valueStart; i < objectText.length; i += 1) {
    const char = objectText[i];
    const next = objectText[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (stringQuote) {
      if (char === '\\') {
        i += 1;
      } else if (char === stringQuote) {
        stringQuote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      stringQuote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth += 1;
    if (char === '}' || char === ']' || char === ')') {
      if (depth === 1) return trimEndIndex(objectText, i);
      depth -= 1;
    }
    if (char === ',' && depth === 1) return trimEndIndex(objectText, i);
  }

  return trimEndIndex(objectText, objectText.length);
}

function insertTopLevelProperty(objectText, key, literal) {
  const closingIndex = objectText.lastIndexOf('}');
  if (closingIndex === -1) {
    throw new Error('Cannot insert property into object without closing brace');
  }
  const closingLineStart = objectText.lastIndexOf('\n', closingIndex) + 1;
  const closingIndent = objectText.slice(closingLineStart, closingIndex);
  const propertyIndent = inferPropertyIndent(objectText, closingIndent);
  const beforeClosing = objectText.slice(0, closingIndex);
  const trimmedEnd = trimEndIndex(beforeClosing, beforeClosing.length);
  const needsComma = trimmedEnd > 0 && beforeClosing[trimmedEnd - 1] !== '{' && beforeClosing[trimmedEnd - 1] !== ',';
  const prefix = `${beforeClosing.slice(0, trimmedEnd)}${needsComma ? ',' : ''}`;
  const suffix = objectText.slice(closingIndex);
  return `${prefix}\n${propertyIndent}${key}: ${literal}\n${closingIndent}${suffix}`;
}

function inferPropertyIndent(objectText, fallbackClosingIndent) {
  const lines = objectText.split('\n');
  for (const line of lines.slice(1)) {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('}')) continue;
    return line.slice(0, line.length - trimmed.length);
  }
  return `${fallbackClosingIndent}  `;
}

function getObjectDepth(text, untilIndex) {
  let depth = 0;
  let stringQuote = '';
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < untilIndex; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (stringQuote) {
      if (char === '\\') {
        i += 1;
      } else if (char === stringQuote) {
        stringQuote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      stringQuote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
  }
  return depth;
}

function isInsideStringOrComment(text, targetIndex) {
  let stringQuote = '';
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < targetIndex; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (stringQuote) {
      if (char === '\\') {
        i += 1;
      } else if (char === stringQuote) {
        stringQuote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      stringQuote = char;
    }
  }
  return Boolean(stringQuote || inLineComment || inBlockComment);
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === true) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimEndIndex(text, end) {
  let cursor = end;
  while (cursor > 0 && /\s/.test(text[cursor - 1])) cursor -= 1;
  return cursor;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function todayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function printUsage() {
  console.log(`Usage:
  node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs inventory [--provider OpenAI] [--json]
  node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs plan-template [--provider OpenAI]
  node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs apply-plan --plan /tmp/plan.json (--dry-run | --write) [--json]
  node .agents/skills/model-provider-updater/scripts/model_provider_presets.mjs check-sources [--provider OpenAI] [--strict] [--json] [--concurrency 4]

Options:
  --repo-root <path>  Override the FastGPT plugin repository root.
  --provider <name>   Limit to one provider or a comma-separated list.
  --concurrency <n>   Limit concurrent source URL checks.
`);
}
