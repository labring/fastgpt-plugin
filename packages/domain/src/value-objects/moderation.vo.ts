import z from 'zod';

import { PluginSourceSchema } from './plugin.vo';
import { SystemVarSchema } from './system-var.vo';

/**
 * 内容审查标准结构。
 *
 * 裁决归一为四档 `pass | block | suspected | error`。provider 原生判定到标准档位的映射
 * 由各 provider 适配器承担：
 * - 腾讯天御 TMS `Suggestion`：Pass / Review(→ suspected) / Block；
 * - 百度内容审核 `conclusionType`：1 合规 / 2 不合规 / 3 疑似 / 4 审核失败(→ error)；
 * - OpenAI Moderation `flagged`：false / true（无 suspected）；
 * - 网易易盾 `action`：0 通过 / 1 拦截 / 2 疑似；
 * - 阿里云内容安全 `RiskLevel`：none、low → pass，medium → suspected，high → block。
 *
 * `suspected` 与 `error` 必须分开：前者是 provider 给出的判定，后者是 provider **没能**给出判定。
 * 是否放行由调用方（FastGPT）决定，本层只输出档位与逐项命中，不实现决策，也不做阈值调档。
 */

export const ModerationVerdictSchema = z.enum(['pass', 'block', 'suspected', 'error']);
export const ModerationVerdictEnum = ModerationVerdictSchema.enum;
export type ModerationVerdictType = z.infer<typeof ModerationVerdictSchema>;

/** 归一化标签。provider 原生标签原文另存 `hit.providerLabel`，归一化不丢信息 */
export const ModerationLabelSchema = z.enum([
  'porn',
  'politics',
  'terror',
  'contraband',
  'abuse',
  'hate',
  'ad',
  'advertising-law',
  'privacy',
  'flood',
  'self-harm',
  'violence',
  'sexual-minors',
  'other'
]);
export const ModerationLabelEnum = ModerationLabelSchema.enum;
export type ModerationLabelType = z.infer<typeof ModerationLabelSchema>;

export const ModerationHitSchema = z.object({
  label: ModerationLabelSchema,
  /** provider 原生标签原文（Porn / 色情 / 100 / sexual ...） */
  providerLabel: z.string(),
  subLabel: z.string().optional(),
  /**
   * provider 对**该标签**的风险置信度，0-100。必须是 provider 原生数值
   * （腾讯 `Score`、阿里云 `Confidence`、OpenAI `category_scores`）。
   * 禁止把枚举或布尔（`conclusionType`、`action`、`flagged`）编成数字填入——那会伪造一个
   * provider 并没有给出的刻度。provider 无置信度时省略该字段。
   */
  score: z.number().min(0).max(100).optional(),
  /** 该标签命中的敏感词 */
  keywords: z.array(z.string()).optional()
});
export type ModerationHitType = z.infer<typeof ModerationHitSchema>;

export const ModerationResultSchema = z.object({
  /** 唯一的权威裁决。`hits` 是明细，不含逐项档位 */
  verdict: ModerationVerdictSchema,
  /**
   * 全部命中词的并集去重（保持首次出现顺序），由 factory 从 `hits[].keywords` 派生后覆盖填写。
   * 语义无歧义，因此由框架统一派生，避免不同适配器有的给有的不给。
   */
  keywords: z.array(z.string()),
  /** 逐项命中明细。本层不消费，交调用方定位与人工复核 */
  hits: z.array(ModerationHitSchema),
  /** `manifest.meta.provider` 回声，由 factory 权威填充 */
  provider: z.string(),
  requestId: z.string().optional(),
  /**
   * `verdict === 'error'` 时必填：provider 无法判定的原因。
   * 不得包含 secrets 或完整上游响应。
   */
  errorMessage: z.string().optional()
}).strict();
export type ModerationResultType = z.infer<typeof ModerationResultSchema>;

export const ModerationCheckInputSchema = z.object({
  /** Text to review. */
  content: z.string().min(1),
  /** provider 场景标识，如 comment / chat / profile */
  scene: z.string().optional(),
  userId: z.string().optional(),
  userIp: z.string().optional(),
  dataId: z.string().optional(),
  /** 上下文关联审核（对应腾讯 SessionId / 阿里云 AssociateId 语义） */
  sessionId: z.string().optional(),
  /** True when content may grow; the caller can repeat the synchronous check. Passed through unchanged. */
  partial: z.boolean().optional()
}).strict();
export type ModerationCheckInputType = z.infer<typeof ModerationCheckInputSchema>;

/** check 事件的 payload，形状与 PluginToolRunPayloadType 对齐 */
export const ModerationCheckPayloadSchema = z.object({
  input: ModerationCheckInputSchema,
  secrets: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarSchema
});
export type ModerationCheckPayloadType = z.infer<typeof ModerationCheckPayloadSchema>;

/** 调用方入参（HTTP / SDK client），与 ToolRunInputSchema 同构（无 childId） */
export const ModerationCheckRunInputSchema = z.object({
  pluginId: z.string(),
  version: z.preprocess((value) => {
    if (value === '') return undefined;
    return value;
  }, z.string().optional()),
  source: PluginSourceSchema.optional(),
  input: ModerationCheckInputSchema,
  secrets: z.record(z.string(), z.unknown()).optional(),
  systemVar: SystemVarSchema
});
export type ModerationCheckRunInputType = z.infer<typeof ModerationCheckRunInputSchema>;
