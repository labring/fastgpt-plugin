This document will describe how to contribute a system tool to FastGPT.

## 0. Prerequisites

- [Bun](https://bun.sh/)
- `git clone git@github.com:labring/fastgpt-plugin.git`
- `cd fastgpt-plugin && bun i`

## 1. Create and Configure System Tool

### 1. Execute the following command and create tool according to the prompts
```bash
bun run new
```

The system tool directory is `packages/tool/packages/[your-tool-name]`.

System Tool file structure:
```plaintext
src // Source code, processing logic
└── index.ts
test // Test cases
└── index.test.ts
config.ts // Configuration
index.ts // Entry point, do not modify this file
logo.svg // Icon
package.json // npm package
```

Toolset file structure:
```plaintext
children
└── tool // Structure inside is the same as the tool above, without package.json
config.ts
index.ts
logo.svg
package.json
```

### 2. Modify config.ts

- **name** and **description** fields are in both Chinese and English
- **type** is an enumeration type, currently available:
	- Tools
	- Search
	- Multimodal
	- Communication
	- Other
- **icon** can use externally accessible links. You can also provide an SVG image as an icon, thus leave this field empty.
- **versionList** (configured in tools) for version management, is a list with element format:
	- value: Version number, recommend using semver
	- description: Description
	- inputs: Input parameters
	- outputs: Return values
- **children**: (Toolset configuration), need to import tools manually and write them in.
- **toolId**: Generally not needed, will automatically use directory name as ID. If filled, it will override. Note this ID is globally unique, cannot be modified arbitrarily, and cannot override existing tool IDs.

#### inputs Parameter Format
General format:
```ts
{
  key: 'Unique key within this tool, same with src/index.ts InputType definition',
  label: 'Label displayed on frontend',
  renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference], // Frontend input type
  valueType: WorkflowIOValueTypeEnum.string, // Data type
  toolDescription: 'Description used during tool invocation'
}
```

Specifically, there's an input with `key === 'system_input_config'`, which configures tool **Secrets**
- `system-level keys` can be configured in commercial version dashboard.
- `temporary keys` can be configured in workflow nodes.

Keys will be saved through symmetric encryption to ensure security.

> You can refer to the dalle3 configuration in officially provided tools

```
// This field in dalle3's config.ts
{
  key: 'system_input_config', // Must be this value
  label: '', // Leave empty
  inputList: [
	{
	  key: 'url',
	  label: 'Dalle3 API Base URL',
	  description: 'For example: https://api.openai.com',
	  inputType: 'input',
	  required: true
	},
	{
	  key: 'authorization',
	  label: 'API Credentials (no Bearer needed)',
	  description: 'sk-xxxx',
	  required: true,
	  inputType: 'secret'
	}
  ],
  renderTypeList: [FlowNodeInputTypeEnum.hidden], // Must be this value
  valueType: WorkflowIOValueTypeEnum.object // Must be this value
},
```

As you can see, you need to provide an `inputList` array, where each element needs the following five fields:

- key: Unique key
- label: Name of this item
- description: Description
- inputType: Input type, three options:
	- input: input box,
	- secret: secret input box,
	- boolean: switch
- required: Whether this item is required

#### outputs Parameter Format
```
{
  id: 'link', // Unique value
  type: FlowNodeOutputTypeEnum.static, // Must be static
  valueType: WorkflowIOValueTypeEnum.string, // See this Enum type definition for specifics
  key: 'link', // Corresponds to member name in return value
  label: 'Image Access Link', // Name
  description: 'Image Access Link' // Description
}
```

## 2. Write Processing Logic

Write processing logic in `src/index.ts` as entry point

Note:
1. Use zod for type definition, export as InputType and OutputType schemas.
2. No need to perform parse validation in code (automatically handled externally)
3. Entry function is `tool`, you can define other functions.
```ts
import { format } from 'date-fns';
import { z } from 'zod';

export const InputType = z.object({
  formatStr: z.string().optional()
});

export const OutputType = z.object({
  time: z.string()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const formatStr = props.formatStr || 'yyyy-MM-dd HH:mm:ss';

  return {
    time: format(new Date(), formatStr)
  };
}
```

The above example provides a simple case that takes formatStr (format string) as input and returns current time. You can see that "any" npm packages can be used in tools.

> If you need to install npm packages, execute `bun add PACKAGE` in the current tool directory

## 3. Debugging & Testing

#### Unit Testing

Write test cases in `test/index.test.ts`, use `bun run test` or pass `filter` parameter for filtering unit tests.

> Uses vitest framework for testing
>
> Do not use `bun test` command, this command uses bun's built-in testing framework

#### (Coming Soon) Visual Debugging

## 4. Publishing and Deployment
### 1. Publishing

Currently only supports providing plugins to FastGPT official. For private deployment, see next section.

After completing all above content, submit PR to official repository `github.com/labring/fastgpt-plugin`. After we review and approval, it can be included as FastGPT's official plugin.

### 2. Deployment

#### Build
In the root directory of `fastgpt-plugin`

```bash
bun run build
```

Bundled files are in `dist` directory, execute `node ./dist/index.js` to run

#### Deploy using docker

Below is a reference docker build command

```bash
docker buildx build --platform=linux/amd64 -f Dockerfile -t fastgpt-plugin:latest .
```

Refer to docker-compose.yaml for deployment.
