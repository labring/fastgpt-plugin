import type { BunPlugin } from 'bun';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { readdirSync } from 'fs';

const transformSourceCode = async ({
  sourceCode,
  filePath
}: {
  sourceCode: string;
  filePath: string;
}) => {
  const ast = parse(sourceCode, {
    plugins: ['typescript'],
    sourceType: 'module'
  });
  const toolId = (() => {
    const stack = filePath.split('/');
    if (stack.at(-3) === 'children') {
      const parentName = stack.at(-4);
      return `${parentName}/${stack.at(-2)}`;
    } else {
      return stack.at(-2);
    }
  })() as string;

  traverse(ast, {
    CallExpression(path) {
      if (
        path.node.callee.type === 'Identifier' &&
        // path.node.callee.name === 'defineToolSet' &&
        path.node.arguments[0] &&
        path.node.arguments[0].type === 'ObjectExpression'
      ) {
        let hasToolId = false;
        traverse(
          path.node,
          {
            ObjectProperty(path) {
              if (path.node.key.type === 'Identifier' && path.node.key.name === 'toolId') {
                hasToolId = true;
              }
            }
          },
          path.scope,
          path.parentPath
        );
        // console.log('hasToolId', hasToolId, toolId);
        if (!hasToolId) {
          path.node.arguments[0].properties.push({
            type: 'ObjectProperty',
            key: {
              type: 'Identifier',
              name: 'toolId'
            },
            value: {
              type: 'StringLiteral',
              value: toolId
            },
            computed: false,
            shorthand: false
          });
        }

        if (path.node.callee.name === 'defineToolSet') {
          let hasCustomChildren = false;
          traverse(
            path.node,
            {
              ObjectProperty(path) {
                if (path.node.key.type === 'Identifier' && path.node.key.name === 'children') {
                  hasCustomChildren = true;
                }
              }
            },
            path.scope,
            path.parentPath
          );
          if (hasCustomChildren) {
            return;
          }
          // now filePath: modules/tool/packages/[toolSet]/config.ts
          // get the children dir : modules/tool/packages/[toolSet]/children
          const childrenDir = filePath.split('/').slice(0, -1).join('/') + '/children';
          // get children's name
          const children = readdirSync(childrenDir);
          // add import and children property
          // add import sentences
          for (const child of children) {
            ast.program.body.unshift({
              type: 'ImportDeclaration',
              source: {
                type: 'StringLiteral',
                value: `./children/${child}`
              },
              importKind: 'value',
              specifiers: [
                {
                  type: 'ImportDefaultSpecifier',
                  local: {
                    type: 'Identifier',
                    name: child
                  }
                }
              ]
            });
          }
          // add children property
          path.node.arguments[0].properties.push({
            type: 'ObjectProperty',
            key: {
              type: 'Identifier',
              name: 'children'
            },
            value: {
              type: 'ArrayExpression',
              elements: children.map((child) => {
                return {
                  type: 'Identifier',
                  name: child
                };
              })
            },
            computed: false,
            shorthand: false
          });
        }
      }
    }
  });
  return generate(ast).code;
};

export const autoToolIdPlugin: BunPlugin = {
  name: 'buildTool',
  setup(build) {
    build.onLoad(
      {
        filter: /packages\/.+\/config\.ts/
      },
      async (args) => {
        const content = await Bun.file(args.path).text();
        if (content.includes('toolId:')) {
          return {
            contents: content,
            loader: 'ts'
          };
        }
        return {
          contents: await transformSourceCode({
            sourceCode: content,
            filePath: args.path
          }),
          loader: 'ts'
        };
      }
    );
  },
  target: 'node'
};
