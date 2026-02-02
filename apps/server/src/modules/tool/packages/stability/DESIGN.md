# Stability 工具集设计文档

## 参考信息

### 参考文档

- API 文档: https://platform.stability.ai/docs/api-reference
- Ultra API: https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1ultra/post
- Core API: https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1core/post
- SD3.5 API: https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1sd3/post

### 测试密钥环境变量名

STABILITY_KEY

### 参考实现

参考 `/Volumes/code/dev/fastgpt-plugin/modules/tool/packages/dalle3/src/index.ts` 的实现方式

## 功能描述

实现 Stability AI 图像生成工具集，包含一个子工具。

### 工具集配置

- 工具集名称：Stability AI Image Generation
- 密钥配置：STABILITY_KEY (必填)
- 工具类型：ToolTypeEnum.tools

### 子工具列表

#### 1. imageGenerate - 图像生成工具

**功能**：根据提示词生成图像，支持多种模型选择

**模型选项**：
- `ultra`: Stability Ultra - 高质量图像生成
- `core`: Stability Core - 平衡性能和质量
- `sd3.5-large`: SD3.5 Large - 大型模型
- `sd3.5-large-turbo`: SD3.5 Large Turbo - 快速大型模型
- `sd3.5-medium`: SD3.5 Medium - 中型模型

**API 端点路由**：
- Ultra: `https://api.stability.ai/v2beta/stable-image/generate/ultra`
- Core: `https://api.stability.ai/v2beta/stable-image/generate/core`
- SD3.5 系列: `https://api.stability.ai/v2beta/stable-image/generate/sd3`

**输入参数**：
- `STABILITY_KEY` (string, 必填): API 密钥
- `prompt` (string, 必填): 图像生成提示词，描述想要生成的图像
- `model` (string, 必填): 模型选择，可选值见上述模型选项
- `aspect_ratio` (string, 可选): 图像宽高比，默认 "1:1"
  - 支持的比例: "1:1", "16:9", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21"
- `negative_prompt` (string, 可选): 负面提示词，描述不希望出现的内容
- `seed` (number, 可选): 随机种子，范围 0-4294967294，用于可重现的生成
- `output_format` (string, 可选): 输出格式，可选 "png" 或 "jpeg"，默认 "png"
- `style_preset` (string, 可选): 样式预设 (仅 core 模型支持)

**输出参数**：
- `link` (string): 上传后的图片访问链接
- `seed` (number): 使用的随机种子值

## 目录结构

```
modules/tool/packages/stability/
├── index.ts                          # 工具集导出主文件
├── config.ts                         # 工具集配置文件
├── package.json                      # 依赖管理
├── logo.svg                          # 工具图标
├── DESIGN.md                         # 设计文档
└── children/                         # 子工具目录
    └── imageGenerate/                # 图像生成子工具
        ├── index.ts                  # 子工具导出
        ├── config.ts                 # 子工具配置
        └── src/
            └── index.ts              # 业务逻辑实现
```

## 输入输出配置

### imageGenerate 工具配置

#### 输入配置 (inputs)

```typescript
[
  {
    key: 'prompt',
    label: '提示词',
    description: '描述想要生成的图像',
    required: true,
    valueType: WorkflowIOValueTypeEnum.string,
    renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
    toolDescription: 'The description of the image to generate'
  },
  {
    key: 'model',
    label: '模型选择',
    description: '选择图像生成模型',
    required: true,
    valueType: WorkflowIOValueTypeEnum.string,
    renderTypeList: [FlowNodeInputTypeEnum.select],
    list: [
      { label: 'Ultra (高质量)', value: 'ultra' },
      { label: 'Core (平衡)', value: 'core' },
      { label: 'SD3.5 Large', value: 'sd3.5-large' },
      { label: 'SD3.5 Large Turbo', value: 'sd3.5-large-turbo' },
      { label: 'SD3.5 Medium', value: 'sd3.5-medium' }
    ],
    defaultValue: 'core'
  },
  {
    key: 'aspect_ratio',
    label: '宽高比',
    description: '图像的宽高比例',
    required: false,
    valueType: WorkflowIOValueTypeEnum.string,
    renderTypeList: [FlowNodeInputTypeEnum.select],
    list: [
      { label: '1:1 (正方形)', value: '1:1' },
      { label: '16:9 (宽屏)', value: '16:9' },
      { label: '21:9 (超宽)', value: '21:9' },
      { label: '2:3 (竖屏)', value: '2:3' },
      { label: '3:2 (横屏)', value: '3:2' },
      { label: '4:5 (竖屏)', value: '4:5' },
      { label: '5:4 (横屏)', value: '5:4' },
      { label: '9:16 (竖屏)', value: '9:16' },
      { label: '9:21 (超竖)', value: '9:21' }
    ],
    defaultValue: '1:1'
  },
  {
    key: 'negative_prompt',
    label: '负面提示词',
    description: '描述不希望在图像中出现的内容',
    required: false,
    valueType: WorkflowIOValueTypeEnum.string,
    renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference]
  },
  {
    key: 'seed',
    label: '随机种子',
    description: '用于可重现的生成，范围 0-4294967294',
    required: false,
    valueType: WorkflowIOValueTypeEnum.number,
    renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
    min: 0,
    max: 4294967294
  },
  {
    key: 'output_format',
    label: '输出格式',
    description: '生成图像的文件格式',
    required: false,
    valueType: WorkflowIOValueTypeEnum.string,
    renderTypeList: [FlowNodeInputTypeEnum.select],
    list: [
      { label: 'PNG', value: 'png' },
      { label: 'JPEG', value: 'jpeg' }
    ],
    defaultValue: 'png'
  }
]
```

#### 输出配置 (outputs)

```typescript
[
  {
    key: 'link',
    label: '图片链接',
    description: '生成的图片访问链接',
    valueType: WorkflowIOValueTypeEnum.string
  },
  {
    key: 'seed',
    label: '使用的种子',
    description: '本次生成使用的随机种子值',
    valueType: WorkflowIOValueTypeEnum.number
  }
]
```

## 代码示例

### API 请求格式

```typescript
// FormData 格式提交
const formData = new FormData();
formData.append('prompt', prompt);
formData.append('aspect_ratio', aspect_ratio);
formData.append('output_format', output_format);

if (negative_prompt) {
  formData.append('negative_prompt', negative_prompt);
}
if (seed !== undefined) {
  formData.append('seed', seed.toString());
}

// 根据模型选择 API 端点
const endpoint = getApiEndpoint(model);

// 发送请求
const response = await POST(endpoint, formData, {
  headers: {
    'Authorization': `Bearer ${STABILITY_KEY}`,
    'Accept': 'image/*'
  }
});
```

### API 响应格式

```json
{
  "image": "base64_encoded_image_data",
  "seed": 1234567890
}
```

### 图片上传流程

```typescript
// 1. 将 base64 转换为 Buffer
const buffer = Buffer.from(imageBase64, 'base64');

// 2. 上传文件
const uploadResult = await uploadFile({
  buffer: buffer,
  defaultFilename: `stability-${model}.${output_format}`
});

// 3. 返回访问链接
return {
  link: uploadResult.accessUrl,
  seed: responseSeed
};
```

## 测试方案

### 单元测试 (imageGenerate/test/index.test.ts)

```typescript
describe('Stability imageGenerate Tests', () => {
  // 测试输入验证
  it('should reject empty prompt', async () => {
    await expect(tool({
      STABILITY_KEY: 'test',
      prompt: '',
      model: 'core'
    })).rejects.toThrow();
  });

  // 测试模型选择
  it('should accept valid model', async () => {
    const validModels = ['ultra', 'core', 'sd3.5-large', 'sd3.5-large-turbo', 'sd3.5-medium'];
    for (const model of validModels) {
      const result = await tool({
        STABILITY_KEY: process.env.STABILITY_KEY!,
        prompt: 'test prompt',
        model
      });
      expect(result.link).toBeDefined();
    }
  });

  // 测试宽高比
  it('should accept valid aspect ratios', async () => {
    const validRatios = ['1:1', '16:9', '9:16'];
    for (const ratio of validRatios) {
      const result = await tool({
        STABILITY_KEY: process.env.STABILITY_KEY!,
        prompt: 'test',
        model: 'core',
        aspect_ratio: ratio
      });
      expect(result.link).toBeDefined();
    }
  });

  // 测试种子可重现性
  it('should generate same image with same seed', async () => {
    const seed = 123456;
    const result1 = await tool({
      STABILITY_KEY: process.env.STABILITY_KEY!,
      prompt: 'test',
      model: 'core',
      seed
    });
    expect(result1.seed).toBe(seed);
  });
});
```

### 集成测试

1. 测试所有模型的图像生成
2. 测试不同宽高比的生成
3. 测试种子的可重现性
4. 测试负面提示词的效果
5. 测试不同输出格式

## 可能存在的问题和重点检查内容

### API 调用

1. **FormData 格式**: Stability API 要求使用 FormData 格式提交，不是 JSON
2. **Authorization Header**: 格式为 `Bearer ${STABILITY_KEY}`
3. **Accept Header**: 需要设置为 `image/*` 或 `application/json`
4. **API 端点路由**: 根据模型正确选择 ultra/core/sd3 端点
5. **SD3.5 模型参数**: SD3.5 系列使用 `model` 参数指定具体模型名

### 数据处理

1. **Base64 解码**: API 返回 base64 编码的图片数据，需要正确解码
2. **Buffer 转换**: 上传前需要将 base64 转换为 Buffer
3. **文件扩展名**: 根据 output_format 使用正确的文件扩展名
4. **Seed 值**: 需要正确返回 API 响应中的 seed 值

### 错误处理

1. **API 密钥验证**: 检查 STABILITY_KEY 是否存在
2. **模型验证**: 验证模型名称是否有效
3. **参数范围**: seed 值必须在 0-4294967294 范围内
4. **网络错误**: 处理超时和连接失败
5. **上传失败**: 处理图片上传失败的情况

### 性能优化

1. **超时设置**: 图像生成可能需要较长时间，设置合理的超时时间
2. **文件大小**: 注意生成图片的大小，避免超出上传限制
3. **错误重试**: 对于网络错误实现合理的重试机制

### 兼容性

1. **模型可用性**: 某些模型可能有访问限制
2. **参数支持**: 不同模型支持的参数可能不同 (如 style_preset 仅 core 支持)
3. **宽高比限制**: 不同模型可能支持不同的宽高比选项