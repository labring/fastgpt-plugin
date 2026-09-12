import { describe, expect, it } from 'vitest';

import { ModelTypeEnum, type ProviderConfigType } from '../type';

declare global {
  interface ImportMeta {
    glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
  }
}

const providerModules = import.meta.glob<{ default: ProviderConfigType }>('./*/index.ts', {
  eager: true
});
const providerConfigs = Object.values(providerModules).map(({ default: config }) => config);

const typeRank: Record<string, number> = {
  [ModelTypeEnum.llm]: 0,
  [ModelTypeEnum.embedding]: 1,
  [ModelTypeEnum.rerank]: 2,
  [ModelTypeEnum.tts]: 3,
  [ModelTypeEnum.stt]: 4
};

describe('static model provider ordering', () => {
  it.each(providerConfigs)(
    'groups $provider models by the configured type priority',
    ({ list }) => {
      const ranks = list.map((model) => typeRank[model.type] ?? 5);

      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  );

  it('places Qwen 3.8 models before Qwen 3.7 models', () => {
    const qwen = providerConfigs.find(({ provider }) => provider === 'Qwen');
    const modelIds = qwen?.list.map((model) => model.model) ?? [];
    const lastQwen38Index = modelIds.reduce(
      (lastIndex, model, index) => (model.startsWith('qwen3.8-') ? index : lastIndex),
      -1
    );
    const firstQwen37Index = modelIds.findIndex((model) => model.startsWith('qwen3.7-'));

    expect(lastQwen38Index).toBeGreaterThanOrEqual(0);
    expect(firstQwen37Index).toBeGreaterThan(lastQwen38Index);
  });

  it('keeps Qwen snapshots and specialized models ahead of their aliases', () => {
    const qwen = providerConfigs.find(({ provider }) => provider === 'Qwen');
    const modelIds = qwen?.list.map((model) => model.model) ?? [];

    expect(modelIds.indexOf('qwen3.8-max-0902')).toBeLessThan(modelIds.indexOf('qwen3.8-max'));
    expect(modelIds.indexOf('qwen3.8-27b')).toBeLessThan(modelIds.indexOf('qwen3.7-max'));
    expect(modelIds.indexOf('qwen3.8-2.4t-a95b')).toBeLessThan(modelIds.indexOf('qwen3.7-max'));
    expect(modelIds.indexOf('qwen3.7-flash-2026-07-15')).toBeLessThan(
      modelIds.indexOf('qwen3.7-flash')
    );
    expect(modelIds.indexOf('qwen3.7-text-embedding')).toBeLessThan(
      modelIds.indexOf('qwen3.7-text-embedding-flash')
    );
    expect(modelIds.indexOf('qwen3.7-text-embedding-flash')).toBeLessThan(
      modelIds.indexOf('text-embedding-v4')
    );
    expect(modelIds.indexOf('qwen3.7-text-rerank')).toBeLessThan(modelIds.indexOf('qwen3-rerank'));
  });

  it('places Gemini Flash models in descending version order', () => {
    const gemini = providerConfigs.find(({ provider }) => provider === 'Gemini');
    const modelIds = gemini?.list.map((model) => model.model) ?? [];
    const flashModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

    expect(modelIds.slice(0, flashModels.length)).toEqual(flashModels);
  });

  it('places the newest OpenAI and Hunyuan models first', () => {
    const openai = providerConfigs.find(({ provider }) => provider === 'OpenAI');
    const hunyuan = providerConfigs.find(({ provider }) => provider === 'Hunyuan');

    expect(openai?.list[0]?.model).toBe('gpt-6-astra');
    expect(hunyuan?.list[0]?.model).toBe('hy4-preview');
  });

  it('places the newest Ant Ling model first', () => {
    const antling = providerConfigs.find(({ provider }) => provider === 'AntLing');

    expect(antling?.list[0]?.model).toBe('Ling-3.0-flash-VL');
  });

  it('places Ernie preview models before their stable aliases', () => {
    const ernie = providerConfigs.find(({ provider }) => provider === 'Ernie');
    const modelIds = ernie?.list.map((model) => model.model) ?? [];

    expect(modelIds.indexOf('ernie-x1.1-preview')).toBeGreaterThanOrEqual(0);
    expect(modelIds.indexOf('ernie-5.0-thinking-preview')).toBeGreaterThanOrEqual(0);
    expect(modelIds.indexOf('ernie-5.0-thinking-exp')).toBeGreaterThan(
      modelIds.indexOf('ernie-5.0-thinking-preview')
    );
    expect(modelIds.indexOf('ernie-x1.1')).toBeGreaterThan(modelIds.indexOf('ernie-x1.1-preview'));
    expect(modelIds.indexOf('ernie-5.0-thinking-latest')).toBeGreaterThan(
      modelIds.indexOf('ernie-5.0-thinking-exp')
    );
  });

  it('places Groq-hosted Qwen models in descending version order', () => {
    const groq = providerConfigs.find(({ provider }) => provider === 'Groq');
    const modelIds = groq?.list.map((model) => model.model) ?? [];

    expect(modelIds.indexOf('qwen/qwen3.8-27b')).toBeLessThan(modelIds.indexOf('qwen/qwen3.6-27b'));
    expect(modelIds.indexOf('qwen/qwen3.6-27b')).toBeLessThan(modelIds.indexOf('qwen/qwen3-32b'));
  });

  it('places GPT-5.3 Codex before GPT-5.2', () => {
    const openai = providerConfigs.find(({ provider }) => provider === 'OpenAI');
    const modelIds = openai?.list.map((model) => model.model) ?? [];

    expect(modelIds.indexOf('gpt-5.3-codex')).toBeGreaterThanOrEqual(0);
    expect(modelIds.indexOf('gpt-5.2')).toBeGreaterThan(modelIds.indexOf('gpt-5.3-codex'));
  });

  it('places ChatGLM 5.3 models before 5.2 and 5.1 models', () => {
    const chatglm = providerConfigs.find(({ provider }) => provider === 'ChatGLM');
    const modelIds = chatglm?.list.map((model) => model.model) ?? [];
    const lastGlm53Index = modelIds.reduce(
      (lastIndex, model, index) => (model.startsWith('glm-5.3') ? index : lastIndex),
      -1
    );
    const glm52Index = modelIds.indexOf('glm-5.2');
    const glm51Index = modelIds.indexOf('glm-5.1');

    expect(lastGlm53Index).toBeGreaterThanOrEqual(0);
    expect(glm52Index).toBeGreaterThan(lastGlm53Index);
    expect(glm51Index).toBeGreaterThan(glm52Index);
  });
});
