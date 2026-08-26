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
});
