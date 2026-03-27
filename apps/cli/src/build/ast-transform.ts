import {
  parseSync,
  Visitor,
  type CallExpression,
  type ObjectExpression,
  type OxcError
} from 'oxc-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import { computeSingleToolEtag, computeToolSuiteEtag } from '@fastgpt-plugin/cli/build/etag';

function extractToolId(filePath: string): string {
  const stack = filePath.split('/');
  if (stack.at(-3) === 'children') {
    const parentName = stack.at(-4);
    const childName = stack.at(-2);
    return `${parentName}/${childName}`;
  }

  return stack.at(-2) || 'unknown';
}

async function getChildrenList(configDir: string): Promise<string[]> {
  const childrenDir = path.join(configDir, 'children');

  try {
    await fs.access(childrenDir);
  } catch {
    return [];
  }

  try {
    const entries = await fs.readdir(childrenDir);
    return entries;
  } catch {
    return [];
  }
}

function hasProperty(properties: ObjectExpression['properties'], keyName: string): boolean {
  return properties.some(
    (prop) =>
      prop.type === 'Property' && prop.key?.type === 'Identifier' && prop.key?.name === keyName
  );
}

function applyModifications(
  sourceCode: string,
  modifications: Array<{ start: number; end: number; content: string }>
): string {
  const sorted = modifications.sort((a, b) => b.start - a.start);

  let result = sourceCode;
  for (const mod of sorted) {
    result = result.slice(0, mod.start) + mod.content + result.slice(mod.end);
  }

  return result;
}

export async function transformToolConfig({
  sourceCode,
  filePath
}: {
  sourceCode: string;
  filePath: string;
}): Promise<{ code: string; hasToolId: boolean }> {
  if (sourceCode.includes('toolId:')) {
    return {
      code: sourceCode,
      hasToolId: true
    };
  }

  const toolId = extractToolId(filePath);
  const configDir = path.dirname(filePath);

  const childrenList = await getChildrenList(configDir);
  const singleToolEtag = await computeSingleToolEtag({ rootDir: configDir });
  const toolSuiteEtag =
    childrenList.length > 0
      ? await computeToolSuiteEtag({
          rootDir: configDir,
          toolId,
          children: childrenList
        })
      : null;

  const filename = path.basename(filePath);
  const result = parseSync(filename, sourceCode, {
    sourceType: 'module'
  });

  if (result.errors.length > 0) {
    throw new Error(`Parse errors: ${result.errors.map((e: OxcError) => e.message).join(', ')}`);
  }

  const modifications: Array<{ start: number; end: number; content: string }> = [];
  const targetCallExpressions: CallExpression[] = [];

  const collectVisitor = new Visitor({
    CallExpression(node) {
      if (
        node.callee?.type === 'Identifier' &&
        (node.callee.name === 'defineTool' || node.callee.name === 'defineToolSet') &&
        node.arguments?.[0]?.type === 'ObjectExpression'
      ) {
        targetCallExpressions.push(node);
      }
    }
  });

  collectVisitor.visit(result.program);

  for (const node of targetCallExpressions) {
    const firstArg = node.arguments[0];
    if (firstArg?.type !== 'ObjectExpression') continue;

    const objExpr = firstArg;
    const properties = objExpr.properties || [];
    const isToolSet = node.callee?.type === 'Identifier' && node.callee.name === 'defineToolSet';

    const needsToolId = !hasProperty(properties, 'toolId');
    const needsEtag = !hasProperty(properties, 'etag');
    const needsChildren =
      isToolSet && !hasProperty(properties, 'children') && childrenList.length > 0;

    if (!needsToolId && !needsEtag && !needsChildren) {
      continue;
    }

    // Find the position to insert new properties
    const lastProperty = properties[properties.length - 1];
    const insertPos = lastProperty ? lastProperty.end : (objExpr.start ?? 0) + 1;

    const newProperties: string[] = [];

    if (needsToolId) {
      newProperties.push(`toolId: '${toolId}'`);
    }

    if (needsEtag) {
      const etagValue = isToolSet && toolSuiteEtag ? toolSuiteEtag : singleToolEtag;
      newProperties.push(`etag: '${etagValue}'`);
    }

    if (needsChildren) {
      const childrenArray = childrenList.map((child) => child).join(', ');
      newProperties.push(`children: [${childrenArray}]`);

      // Add imports for children at the beginning of the file
      const importStatements = childrenList
        .map((child) => `import ${child} from './children/${child}';`)
        .join('\n');

      modifications.push({
        start: 0,
        end: 0,
        content: importStatements + '\n'
      });
    }

    if (newProperties.length > 0) {
      const separator = lastProperty ? ',\n  ' : '\n  ';
      const content = separator + newProperties.join(',\n  ');

      modifications.push({
        start: insertPos,
        end: insertPos,
        content
      });
    }
  }

  if (modifications.length === 0) {
    return {
      code: sourceCode,
      hasToolId: false
    };
  }

  const transformedCode = applyModifications(sourceCode, modifications);

  return {
    code: transformedCode,
    hasToolId: true
  };
}
