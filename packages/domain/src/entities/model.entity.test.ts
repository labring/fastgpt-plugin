import { describe, expect, it } from 'vitest';

import {
  EmbeddingModelItemSchema,
  LLMModelItemSchema,
  ModelPriceBillingUnitSchema,
  ModelPriceTierSchema,
  ModelTypeEnum,
  STTModelSchema
} from './model.entity';

describe('ModelPriceTierSchema', () => {
  it('accepts an open-ended tier with non-negative prices', () => {
    expect(
      ModelPriceTierSchema.parse({
        minInputTokens: 256,
        inputPrice: 0.5,
        outputPrice: 2
      })
    ).toEqual({
      minInputTokens: 256,
      inputPrice: 0.5,
      outputPrice: 2
    });
  });

  it('rejects negative token boundaries', () => {
    expect(
      ModelPriceTierSchema.safeParse({
        maxInputTokens: -1,
        inputPrice: 0.5,
        outputPrice: 2
      }).success
    ).toBe(false);
  });
});

describe('ModelPriceBillingUnitSchema', () => {
  it('supports token, character, and duration billing units', () => {
    expect(ModelPriceBillingUnitSchema.options).toEqual([
      'tokens_per_1m',
      'characters_per_1m',
      'seconds_per_60'
    ]);
  });

  it('allows an STT model to override duration billing with token billing', () => {
    expect(
      STTModelSchema.parse({
        provider: 'Test',
        model: 'token-stt',
        name: 'Token STT',
        type: ModelTypeEnum.stt,
        billingUnit: 'tokens_per_1m'
      }).billingUnit
    ).toBe('tokens_per_1m');
  });
});

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
