import { describe, expect, it } from 'vitest';

import {
  type LLMModelItemType,
  ModelItemSchema,
  ModelTypeEnum,
  ReasoningEffortLevelSchema
} from '@domain/entities/model.entity';

import type { ProviderConfigType } from '../type';

declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
  }
}

const providerModules = import.meta.glob<{ default: ProviderConfigType }>('./*/index.ts', {
  eager: true
});
const providerConfigs = Object.values(providerModules).map(({ default: config }) => config);

const staticModelList = providerConfigs.flatMap((provider) =>
  provider.list.map((model) =>
    ModelItemSchema.parse({
      ...model,
      provider: provider.provider,
      name: model.name ?? model.model
    })
  )
);

const canonicalOrder = ReasoningEffortLevelSchema.options;

describe('static model reasoningEffortList presets', () => {
  const llmModels = staticModelList.filter(
    (item): item is LLMModelItemType => item.type === ModelTypeEnum.llm
  );

  it('populates valid, unique, canonical reasoningEffortList for every reasoningEffort-enabled LLM', () => {
    const enabled = llmModels.filter((model) => model.reasoningEffort);
    expect(enabled.length).toBeGreaterThan(0);

    for (const model of enabled) {
      expect(
        model.reasoningEffortList,
        `${model.provider}/${model.model} should define reasoningEffortList`
      ).toBeDefined();
      const list = model.reasoningEffortList ?? [];
      expect(
        list.length,
        `${model.provider}/${model.model} reasoningEffortList should not be empty`
      ).toBeGreaterThan(0);

      // 无重复且按 AI Proxy 标准顺序排列
      expect(new Set(list).size).toBe(list.length);
      const sorted = canonicalOrder.filter((level) => list.includes(level));
      expect(list).toEqual(sorted);
    }
  });

  it('omits reasoningEffortList when reasoningEffort is disabled', () => {
    const disabled = llmModels.filter((model) => !model.reasoningEffort);
    for (const model of disabled) {
      expect(model.reasoningEffortList ?? []).toEqual([]);
    }
  });

  it('aligns key provider presets with official & AI Proxy reasoning effort mappings', () => {
    const findModel = (provider: string, model: string) =>
      llmModels.find((item) => item.provider === provider && item.model === model);

    // OpenAI
    expect(findModel('OpenAI', 'gpt-6.2-astra')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('OpenAI', 'gpt-5.4')?.reasoningEffortList).toEqual([
      'none',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('OpenAI', 'gpt-5.4-pro')?.reasoningEffortList).toEqual([
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('OpenAI', 'gpt-5')?.reasoningEffortList).toEqual([
      'minimal',
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('OpenAI', 'gpt-5-pro')?.reasoningEffortList).toEqual(['high']);
    expect(findModel('OpenAI', 'o3')?.reasoningEffortList).toEqual(['low', 'medium', 'high']);

    // Claude
    expect(findModel('Claude', 'claude-fable-5-2')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Claude', 'claude-opus-4-6')?.reasoningEffortList).toEqual([
      'none',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Claude', 'claude-sonnet-4-5-20250929')?.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Claude', 'claude-opus-4-1-20250805')?.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);

    // Gemini
    expect(findModel('Gemini', 'gemini-4-neon')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Gemini', 'gemini-4-carbon')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Gemini', 'gemini-3.8-flash')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Gemini', 'gemini-3.1-pro')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Gemini', 'gemini-3-flash')?.reasoningEffortList).toEqual([
      'minimal',
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Gemini', 'gemini-2.5-pro')?.reasoningEffortList).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Gemini', 'gemini-2.5-flash')?.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high'
    ]);

    // Other providers
    expect(findModel('Doubao', 'doubao-seed-2-0-pro-260215')?.reasoningEffortList).toEqual([
      'none',
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Doubao', 'glm-5-3-flash-260828')?.reasoningEffortList).toEqual([
      'low',
      'high',
      'xhigh'
    ]);
    expect(findModel('ChatGLM', 'glm-5.3')?.reasoningEffortList).toEqual(['low', 'high', 'xhigh']);
    expect(findModel('ChatGLM', 'glm-5.2')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('DeepSeek', 'deepseek-v4-pro')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('Qwen', 'qwen3-32b')?.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Qwen', 'qwen4-max')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('Grok', 'grok-4.7')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('Meta', 'muse-spark-1.3')?.reasoningEffortList).toEqual([
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('MiniMax', 'MiniMax-M3.1-Flash')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high',
      'xhigh'
    ]);
    expect(findModel('MiniMax', 'MiniMax-M3')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('StepFun', 'step-3.7-flash')?.reasoningEffortList).toEqual([
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('Ernie', 'ernie-5.1')?.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high'
    ]);
    expect(findModel('MistralAI', 'mistral-small-2603')?.reasoningEffortList).toEqual([
      'none',
      'high'
    ]);
    expect(findModel('AliCloud', 'xiaomi/mimo-v2.6-pro-ultraspeed')?.reasoningEffortList).toEqual([
      'none',
      'high'
    ]);
    expect(findModel('AntLing', 'Ling-3.2-flash')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('Hunyuan', 'hunyuan-a13b')?.reasoningEffortList).toEqual(['none', 'high']);
    expect(findModel('SparkDesk', 'spark-x2.6')?.reasoningEffortList).toEqual([
      'none',
      'low',
      'high'
    ]);
  });
});
