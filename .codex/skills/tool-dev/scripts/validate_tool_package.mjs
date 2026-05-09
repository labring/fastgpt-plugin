#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const target = args[0];

if (!target) {
  console.error('Usage: validate_tool_package.mjs <modules/tool/packages/toolName>');
  process.exit(1);
}

const packageDir = resolve(target);
const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function requireFile(path, label = relative(process.cwd(), path)) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    addError(`Missing ${label}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function checkRuntimeSource(path) {
  const content = requireFile(path);
  if (!content) return { inputKeys: new Set(), outputKeys: new Set() };
  const typePath = join(dirname(path), 'type.ts');
  const typeContent = existsSync(typePath) && statSync(typePath).isFile() ? readFileSync(typePath, 'utf8') : '';
  const schemaContent = `${content}\n${typeContent}`;
  if (!/export\s+const\s+InputType\s*=/.test(content)) {
    addError(`${relative(process.cwd(), path)} must export InputType`);
  }
  if (!/export\s+const\s+OutputType\s*=/.test(schemaContent)) {
    addError(`${relative(process.cwd(), path)} or ${relative(process.cwd(), typePath)} must export OutputType`);
  }
  if (!hasToolExport(content)) {
    addError(`${relative(process.cwd(), path)} must export a tool function`);
  }
  if (/\bBun\./.test(content)) {
    addError(`${relative(process.cwd(), path)} uses Bun-only runtime API`);
  }
  if (/catch\s*\([^)]*\)\s*{[\s\S]{0,240}(Promise\.reject|throw|error_message)/.test(content)) {
    addWarning(`${relative(process.cwd(), path)} has catch handling; verify it is not a top-level catch-all`);
  }
  return {
    inputKeys: extractZodObjectKeys(schemaContent, 'InputType'),
    outputKeys: extractZodObjectKeys(schemaContent, 'OutputType')
  };
}

function checkToolDir(dir, options = {}) {
  const rel = relative(process.cwd(), dir);
  const parentSecretKeys = options.parentSecretKeys || new Set();
  const isChild = Boolean(options.isChild);
  const config = requireFile(join(dir, 'config.ts'), `${rel}/config.ts`);
  const index = requireFile(join(dir, 'index.ts'), `${rel}/index.ts`);
  const runtime = checkRuntimeSource(join(dir, 'src/index.ts'));

  if (config && !/defineTool\s*\(/.test(config)) {
    addError(`${rel}/config.ts must use defineTool`);
  }
  if (index && !/exportTool\s*\(/.test(index)) {
    addError(`${rel}/index.ts must use exportTool`);
  }
  if (isChild && /secretInputConfig\s*:/.test(config)) {
    addWarning(`${rel}/config.ts defines child secretInputConfig; prefer parent toolset secrets`);
  }
  checkConfigRuntimeKeys(rel, config, runtime, parentSecretKeys);
}

function checkPackageJson(dir) {
  const path = join(dir, 'package.json');
  const content = requireFile(path, `${relative(process.cwd(), dir)}/package.json`);
  if (!content) return;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    addError(`${relative(process.cwd(), path)} is not valid JSON: ${error.message}`);
    return;
  }
  if (!parsed.scripts?.build) {
    addWarning(`${relative(process.cwd(), path)} has no scripts.build`);
  }
  if (!parsed.dependencies?.zod && !parsed.peerDependencies?.zod) {
    addWarning(`${relative(process.cwd(), path)} does not declare zod`);
  }
}

if (!existsSync(packageDir) || !statSync(packageDir).isDirectory()) {
  addError(`Tool package directory not found: ${packageDir}`);
} else {
  checkPackageJson(packageDir);
  const packageName = basename(packageDir);
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(packageName)) {
    addWarning(`Package directory ${packageName} is not camelCase/PascalCase`);
  }

  const parentConfig = requireFile(join(packageDir, 'config.ts'), `${relative(process.cwd(), packageDir)}/config.ts`);
  const parentIndex = requireFile(join(packageDir, 'index.ts'), `${relative(process.cwd(), packageDir)}/index.ts`);
  const childrenDir = join(packageDir, 'children');
  const hasChildren = existsSync(childrenDir) && statSync(childrenDir).isDirectory();

  if (hasChildren) {
    if (parentConfig && !/defineToolSet\s*\(/.test(parentConfig)) {
      addError(`${relative(process.cwd(), packageDir)}/config.ts must use defineToolSet for a toolset`);
    }
    if (parentIndex && !/exportToolSet\s*\(/.test(parentIndex)) {
      addError(`${relative(process.cwd(), packageDir)}/index.ts must use exportToolSet for a toolset`);
    }
    const parentSecretKeys = extractConfigBlockKeys(parentConfig, 'secretInputConfig');
    const childNames = readdirNames(childrenDir);
    if (childNames.length === 0) {
      addWarning(`${relative(process.cwd(), childrenDir)} is empty`);
    }
    for (const childName of childNames) {
      checkToolDir(join(childrenDir, childName), { isChild: true, parentSecretKeys });
    }
  } else {
    checkToolDir(packageDir);
  }
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`OK: ${relative(process.cwd(), packageDir)} passed structural validation`);

function readdirNames(dir) {
  return readdirSync(dir).filter((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory();
  });
}

function checkConfigRuntimeKeys(rel, config, runtime, inheritedSecretKeys = new Set()) {
  if (!config) return;
  const secretKeys = extractConfigBlockKeys(config, 'secretInputConfig');
  const inputKeys = extractVersionBlockKeys(config, 'inputs');
  const outputKeys = extractVersionBlockKeys(config, 'outputs');
  const acceptedInputKeys = new Set([...inheritedSecretKeys, ...secretKeys, ...inputKeys]);

  for (const key of inputKeys) {
    if (!runtime.inputKeys.has(key)) {
      addWarning(`${rel}: config input '${key}' is not present in InputType`);
    }
  }
  for (const key of runtime.inputKeys) {
    if (!acceptedInputKeys.has(key) && !isLocalizedAlias(key)) {
      addWarning(`${rel}: InputType key '${key}' is not declared in config inputs or secrets`);
    }
  }
  for (const key of outputKeys) {
    if (!runtime.outputKeys.has(key)) {
      addWarning(`${rel}: config output '${key}' is not present in OutputType`);
    }
  }
  for (const key of runtime.outputKeys) {
    if (!outputKeys.has(key)) {
      addWarning(`${rel}: OutputType key '${key}' is not declared in config outputs`);
    }
  }
}

function extractConfigBlockKeys(content, blockName) {
  const blockStart = content.indexOf(`${blockName}:`);
  if (blockStart === -1) return new Set();
  const arrayStart = content.indexOf('[', blockStart);
  if (arrayStart === -1) return new Set();
  const arrayEnd = findMatching(content, arrayStart, '[', ']');
  return extractKeyProperties(content.slice(arrayStart, arrayEnd + 1));
}

function extractVersionBlockKeys(content, blockName) {
  const keys = new Set();
  const pattern = new RegExp(`${blockName}:\\s*\\[`, 'g');
  for (let match = pattern.exec(content); match; match = pattern.exec(content)) {
    const arrayStart = content.indexOf('[', match.index);
    const arrayEnd = findMatching(content, arrayStart, '[', ']');
    for (const key of extractKeyProperties(content.slice(arrayStart, arrayEnd + 1))) {
      keys.add(key);
    }
    pattern.lastIndex = arrayEnd + 1;
  }
  return keys;
}

function extractZodObjectKeys(content, exportName) {
  const exportStart = content.search(new RegExp(`export\\s+const\\s+${exportName}\\s*=`));
  if (exportStart === -1) return new Set();
  const objectMatch = content.slice(exportStart).match(/z\s*\.\s*object\s*\(/);
  const objectCall = objectMatch ? exportStart + objectMatch.index : -1;
  if (objectCall === -1) return new Set();
  const objectStart = content.indexOf('{', objectCall);
  if (objectStart === -1) return new Set();
  const objectEnd = findMatching(content, objectStart, '{', '}');
  return extractObjectPropertyNames(content.slice(objectStart + 1, objectEnd));
}

function hasToolExport(content) {
  return (
    /export\s+async\s+function\s+tool\s*\(/.test(content) ||
    /export\s+function\s+tool\s*\(/.test(content) ||
    /export\s+const\s+tool\s*=\s*(async\s*)?\(/.test(content)
  );
}

function extractKeyProperties(content) {
  const keys = new Set();
  for (const match of content.matchAll(/\bkey\s*:\s*(['"`])([^'"`]+)\1/g)) {
    keys.add(match[2]);
  }
  return keys;
}

function extractObjectPropertyNames(objectBody) {
  const keys = new Set();
  let index = 0;
  while (index < objectBody.length) {
    const match = objectBody.slice(index).match(/(?:^|,|\n)\s*(['"`]?)([A-Za-z_$\u4e00-\u9fff][\w$\u4e00-\u9fff]*)\1\s*:/u);
    if (!match) break;
    const absolute = index + match.index;
    if (getBraceDepth(objectBody, absolute) === 0) {
      keys.add(match[2]);
    }
    index = absolute + match[0].length;
  }
  return keys;
}

function findMatching(content, start, open, close) {
  let depth = 0;
  let quote = '';
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
    if (quote) {
      if (char === '\\') {
        i += 1;
      } else if (char === quote) {
        quote = '';
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
      quote = char;
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

function getBraceDepth(content, untilIndex) {
  let depth = 0;
  for (let i = 0; i < untilIndex; i += 1) {
    if (content[i] === '{' || content[i] === '[' || content[i] === '(') depth += 1;
    if (content[i] === '}' || content[i] === ']' || content[i] === ')') depth -= 1;
  }
  return depth;
}

function isLocalizedAlias(key) {
  return /[\u4e00-\u9fff]/u.test(key);
}
