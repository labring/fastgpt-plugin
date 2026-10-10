---
name: fastgpt-moderation-development
description: Use when developing a FastGPT content moderation plugin with defineModeration(). Covers the standard result contract, verdict semantics, hits, secretSchema and the text-only boundary. General build/debug/pack flow lives in fastgpt-system-tool-development.
---

# FastGPT 内容审查（moderation）插件开发

本 skill 只写 **moderation 相对系统工具的差异面**。通用流程（目录结构、`pnpm run build` /
`check` / `pack` / `dev`、远程调试、占位符与依赖模式）一律读
`../fastgpt-system-tool-development/SKILL.md`，不要复制。

moderation 插件解决一件事：**把某个 provider 的审查接口映射成 FastGPT 的标准结构**。
provider 差异隔离在适配器内部，标准结构由 SDK 强制校验。

## 起手

```bash
npx @fastgpt-plugin/cli create my-moderation --type moderation
```

模板是一个可直接运行的关键词审查 provider（不触网），`pnpm test` 开箱通过。

## 声明插件

```ts
import { defineModeration, defineModerationManifest } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

export default defineModeration({
  manifest: defineModerationManifest({
    pluginId: 'my-moderation',
    version: '1.0.0',
    name: { en: 'My Moderation', 'zh-CN': '我的审查' },
    description: { en: '...', 'zh-CN': '...' },
    meta: {
      provider: 'baidu',      // 写入 result.provider
      docUrl: 'https://...'   // 可选
    }
  }),
  secretSchema,
  provider: {
    name: 'baidu',
    check: async (input, ctx) => {
      // 调 provider HTTP 接口 + 映射结果
      return { verdict: 'pass', hits: [] };
    }
  }
});
```

## 返回结构

```ts
type ModerationProviderResult = {
  verdict: 'pass' | 'block' | 'suspected' | 'error';
  hits: Array<{
    label: ModerationLabelType;   // 归一化标签
    providerLabel: string;        // provider 原生标签原文
    subLabel?: string;
    score?: number;               // 0-100，provider 原生置信度
    keywords?: string[];
  }>;
  requestId?: string;
  errorMessage?: string;          // verdict === 'error' 时必填
};
```

`result.keywords`（全部命中词并集）与 `result.provider` 由 SDK 填充，适配器不用给。

### verdict 四档

- `pass`：provider 判定合规。
- `block`：provider 判定违规。
- `suspected`：provider 给出命中，但置信度不足以直接判违规（腾讯 `Review`、百度 `conclusionType=3`、
  易盾 `action=2`）。
- `error`：provider **没能**给出判定（HTTP 错误、超时、未知标签、百度 `conclusionType=4`）。

`suspected` 与 `error` 必须分开：前者建议人工复核，后者建议重试或兜底。

**provider 无法判定时必须返回 `verdict: 'error'` 的结果**，不要让异常逃出去。未捕获异常会被当作
**框架级失败**（插件缺陷），与「provider 暂时不可用」在运维上无法区分：

```ts
try {
  const res = await fetch(...);
  ...
} catch (error) {
  return ctx.moderationError(`upstream failed: ${getErrText(error)}`);
}
```

### score 是 provider 原生置信度

`score` 只填 provider 真实给出的数值（腾讯 `Score`、阿里云 `Confidence`、OpenAI `category_scores`）。
**不要把枚举或布尔值编成数字**（`conclusionType`、`action`、`flagged`）——那会伪造一个 provider
并没有给出的刻度。provider 没有置信度时省略该字段。

只有一个总体分、没有分项标签的 provider：落成单个 hit（`label: 'other'`、`providerLabel` 填原生
字段名、`score` 填该数值）。

### hits 是逐项明细

`hits` 供调用方定位与人工复核，框架不消费。顶层 `verdict` 才是权威裁决。逐项没有档位字段——
不要试图为每个 hit 造一个档位，只有顶层 `verdict`。

## secrets

`secretSchema` 是一个**扁平**的 zod object；用户填什么，`ctx.secrets` 就是什么。

- **声明了才校验**：声明了 `secretSchema`，SDK 会 `safeParse` 传入的 secrets，不符合则返回
  error 帧；**未声明**时 secrets 原样透传，不解析也不 strip。
- **声明了就自动带上类型**：`ctx.secrets` 的类型由 `secretSchema` 推导，不用手动标注。未声明
  `secretSchema` 时 `ctx.secrets` 是 `Record<string, unknown>`（与运行时「原样透传」一致）。
- 厂商侧配置（接入凭据、策略 ID、词表）都放这里，用 `.meta({ title, isSecret })` 标注：

```ts
const secretSchema = z.object({
  accessKeyId: z.string().meta({ title: 'AccessKey ID', isSecret: true }),
  accessKeySecret: z.string().meta({ title: 'AccessKey Secret', isSecret: true }),
  // 厂商控制台里配好的策略 ID：严格度由 provider 自己控制，框架不做归一化
  strategyId: z.string().optional().meta({ title: 'Strategy ID', isSecret: false })
});
```

## 严格度由 provider 自己控制

框架**不提供**全局审查级别开关，也不做阈值调档。要调严格度就在厂商控制台配好策略，把策略 ID
（腾讯 `BizType`、百度 `strategyId`、易盾 `businessId`）作为 `secretSchema` 的一个配置项透传过去。
`verdict` 是唯一输出，是否放行由 FastGPT 决定。

## 同步文本审查

本版本只支持同步文本审查：`input.content` 就是待审文本字符串，不需要 `modality` 字段。输入 schema
会拒绝旧式 `modality` 字段，避免非文本内容被静默当作文本处理。`check` 同步返回 `ModerationResult`；
异步提交、轮询等能力如有需要，另行设计异步接口，不给同步结果增加 `status` 或 `pending` 分支。

## 调试

```bash
npx @fastgpt-plugin/cli debug . --run --input '{"content":"hello world"}'
npx @fastgpt-plugin/cli debug . --run --secrets '{"blockedKeywords":"badword"}' --input '{"content":"badword"}'
```

本地调试直接驱动插件进程，`response` 帧的 data 就是 `{ verdict, keywords, hits, provider }`，
CLI 会额外打印一份可读摘要。
