这篇文档将为你描述如何为 FastGPT 贡献一个系统工具。

## 0. 准备工作

- [Bun](https://bun.sh/)
- Fork 本仓库
- `git clone git@github.com:your-username/fastgpt-plugin.git`
- `cd fastgpt-plugin && bun i`

## 1. 创建系统工具并配置

### 1. 执行如下命令，根据提示创建工具
```bash
bun run new:tool
```

系统工具的目录在 `packages/tool/packages/[your-tool-name]`下。

系统工具 (Tool) 文件结构如下:
```plaintext
src // 源代码，处理逻辑
└── index.ts
test // 测试样例
└── index.test.ts
config.ts // 配置
index.ts // 入口，不要改这个文件
logo.svg // 图标
package.json // npm 包
```

工具集(toolset) 的文件结构如下
```plaintext
children
└── tool // 这个里面的结构就和上面的 tool 的一样了，没有 package.json
config.ts
index.ts
logo.svg
package.json
```
### 2. 修改 config.ts

- **name** 和 **description** 字段为中文和英文两种语言
- **type** 为枚举类型，目前有:
	- 工具: tools
	- 搜索: search
	- 多模态：multimodal
	- 通讯：communication
	- other: 其他
- **icon** 可以使用外部直接访问的链接，可以提供一个 svg 图片作为图标，此项置空即可。
- **versionList** (工具中配置)用于版本管理，是一个列表，其中的元素格式:
	- value：版本号，建议使用 semver
	- description: 描述
	- inputs 入参
	- outputs 返回值
- **children**：（工具集 toolset 配置），需要将 tool import 后手动写入。
- **toolId**: 一般不需要填，会自动以目录名作为 ID，如果填写了会则会覆盖。注意此 id 全局唯一，不能随意修改，不能覆盖为其他已有的 tool 的 ID。

#### inputs 参数格式
一般格式:
```ts
{
  key: '本工具内唯一的 key，和 src/index.ts 中的 InputType 定义相同',
  label: '前端显示的 label',
  renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference], // 前端输入框的类型
  valueType: WorkflowIOValueTypeEnum.string, // 数据类型
  toolDescription: '工具调用时用到的描述'
}
```

特殊的，有一个 `key === 'system_input_config'` 的输入，其作用是配置工具的**密钥**：可以在商业版后台配置系统级别的密钥/可以在工作流节点中配置临时密钥。

密钥将会通过对称加密的方式保存，以保证安全性。

> 可以参考官方提供的插件中的 dalle3 的配置

```
// dalle3 的 config.ts 中的该字段
{
  key: 'system_input_config', // 必须为这个值
  label: '', // 为空即可
  inputList: [
	{
	  key: 'url',
	  label: 'Dalle3 接口基础地址',
	  description: '例如：https://api.openai.com',
	  inputType: 'input',
	  required: true
	},
	{
	  key: 'authorization',
	  label: '接口凭证（不需要 Bearer）',
	  description: 'sk-xxxx',
	  required: true,
	  inputType: 'secret'
	}
  ],
  renderTypeList: [FlowNodeInputTypeEnum.hidden], // 必须为这个值
  valueType: WorkflowIOValueTypeEnum.object // 必须为这个值
},
```

可以看到需要提供一个 `inputList` 列表，其中的元素需要提供如下五个字段：

- key: 唯一的 key
- label: 这一项的名称
- description: 描述
- inputType: 输入类型，有三种选项：input / secret/ boolean 分别渲染为输入框、密钥输入框、开关
- required: 该项是否为必填

#### outputs 参数格式
```
{
  id: 'link', // 唯一的值
  type: FlowNodeOutputTypeEnum.static, // 必须为 static
  valueType: WorkflowIOValueTypeEnum.string, // 具体可以看这个 Enum 的类型定义
  key: 'link', // 对应返回值中的成员名
  label: '图片访问链接', // 名字
  description: '图片访问链接' // 描述
}
```

## 2. 编写处理逻辑

在 `src/index.ts` 为入口编写处理逻辑

需要注意：
1. 使用 zod 进行类型定义，导出为 InputType 和 OutputType 两个 Schema。
2. 不需要在代码中进行 parse 校验（已经在外部自动处理）
3. 入口函数为 `tool`，可以定义其他的函数。
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

上述例子给出了一个传入 formatStr （格式化字符串）并且返回当前时间的简单样例，可以看到在工具中可以使用“任意的” npm 包。

> 如果需要安装 npm 包，可以在当前工具目录下执行 `bun add PACKAGE` 来进行安装

## 3. 调试

#### 单测

在 `test/index.test.ts` 中编写测试样例，使用 `bun run test` 或传入 `filter` 参数过滤进行单元测试。

> 使用 vitest 框架进行测试
>
> 不要使用 `bun test` 命令，这个命令是使用 bun 内置的测试框架进行测试

#### （未完成）可视化调试

## 4. 发布和部署
### 1. 发布

目前仅支持为 FastGPT 官方提供插件的发布方式。如果需要私有化部署，请看下一节。

进行完毕上述所有内容后，向官方仓库 `github.com/labring/fastgpt-plugin` 提交 PR。官方人员审核通过后即可收录为 FastGPT 的官方插件。

### 2. 部署

#### 编译
在 `fastgpt-plugin` 的根目录下

```bash
bun run build
```

编译后的文件在 dist 目录中，执行 node ./dist/index.js 即可运行

#### 使用 docker 部署

下面是一个供参考的 docker 编译命令

```bash
docker buildx build --platform=linux/amd64 -f Dockerfile -t fastgpt-plugin:latest .
```

参考 docker-compose.yaml 进行部署。
