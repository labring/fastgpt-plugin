import type { BunPlugin } from 'bun';

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
        // there is no toolId, we need to add it.
        // tool: packages/tool/packages/tool/config.ts
        // toolset: packages/tool/packages/toolset/children/tool/config.ts

        const filePath = args.path;
        const stack = filePath.split('/');
        const toolId = (() => {
          if (stack.at(-3) === 'children') {
            const parentName = stack.at(-4);
            return `${parentName}/${stack.at(-2)}`;
          } else {
            return stack.at(-2);
          }
        })();
        const splitIndex = content.indexOf('name:');
        const newContent =
          content.slice(0, splitIndex) + `toolId: '${toolId}',\n` + content.slice(splitIndex);

        return {
          contents: newContent,
          loader: 'ts'
        };
      }
    );
  },
  target: 'node'
};
