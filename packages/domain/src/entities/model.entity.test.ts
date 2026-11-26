import { describe, expect, it } from 'vitest';

import { EmbeddingModelItemSchema, LLMModelItemSchema, ModelTypeEnum } from './model.entity';

const baseLlmModel = {
  provider: 'Test',
  model: 'test-model',
  name: 'Test Model',
  type: ModelTypeEnum.llm,
  maxContext: 128000,
  maxTokens: 8000,
  quoteMaxToken: 100000,
  vision: false,
  reasoning: true,
  reasoningEffort: false,
  toolChoice: true
};

describe('LLMModelItemSchema', () => {
  it('allows unsupported temperature to be omitted', () => {
    expect(LLMModelItemSchema.parse(baseLlmModel)).not.toHaveProperty(
      'maxTemperature'
    );
  });

  it('rejects null and string temperature values', () => {
    expect(
      LLMModelItemSchema.safeParse({ ...baseLlmModel, maxTemperature: null })
        .success
    ).toBe(false);
    expect(
      LLMModelItemSchema.safeParse({ ...baseLlmModel, maxTemperature: '' })
        .success
    ).toBe(false);
    expect(
      LLMModelItemSchema.safeParse({ ...baseLlmModel, maxTemperature: '1' })
        .success
    ).toBe(false);
  });

  it('validates reasoningEffortList against AI Proxy levels', () => {
    const parsed = LLMModelItemSchema.parse({
      ...baseLlmModel,
      reasoningEffort: true,
      reasoningEffortList: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh']
    });
    expect(parsed.reasoningEffortList).toEqual([
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh'
    ]);

    expect(LLMModelItemSchema.parse(baseLlmModel)).not.toHaveProperty('reasoningEffortList');
    expect(
      LLMModelItemSchema.safeParse({
        ...baseLlmModel,
        reasoningEffort: true,
        reasoningEffortList: ['low', 'max']
      }).success
    ).toBe(false);
  });
});

const baseEmbeddingModel = {
  provider: 'Test',
  model: 'test-embedding',
  name: 'Test Embedding',
  type: ModelTypeEnum.embedding,
  defaultToken: 512,
  maxToken: 8000
};

describe('EmbeddingModelItemSchema', () => {
  it('accepts vision flag for multimodal embedding models', () => {
    const parsed = EmbeddingModelItemSchema.parse({
      ...baseEmbeddingModel,
      vision: true
    });
    expect(parsed.vision).toBe(true);
  });

  it('allows vision flag to be false or omitted', () => {
    const withFalse = EmbeddingModelItemSchema.parse({
      ...baseEmbeddingModel,
      vision: false
    });
    expect(withFalse.vision).toBe(false);

    const omitted = EmbeddingModelItemSchema.parse(baseEmbeddingModel);
    expect(omitted.vision).toBeUndefined();
  });
});
