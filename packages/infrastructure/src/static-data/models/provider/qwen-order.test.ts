import { describe, expect, it } from 'vitest';

import { ModelTypeEnum } from '../type';

import qwen from './Qwen';

const typeRank: Record<string, number> = {
  [ModelTypeEnum.llm]: 0,
  [ModelTypeEnum.embedding]: 1,
  [ModelTypeEnum.rerank]: 2,
  [ModelTypeEnum.tts]: 3,
  [ModelTypeEnum.stt]: 4
};

describe('Qwen static model ordering', () => {
  it('groups models by the configured type priority', () => {
    const ranks = qwen.list.map((model) => typeRank[model.type] ?? 5);

    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('places Qwen 3.8 models before Qwen 3.7 models', () => {
    const modelIds = qwen.list.map((model) => model.model);
    const lastQwen38Index = modelIds.reduce(
      (lastIndex, model, index) => (model.startsWith('qwen3.8-') ? index : lastIndex),
      -1
    );
    const firstQwen37Index = modelIds.findIndex((model) => model.startsWith('qwen3.7-'));

    expect(lastQwen38Index).toBeGreaterThanOrEqual(0);
    expect(firstQwen37Index).toBeGreaterThan(lastQwen38Index);
  });
});
