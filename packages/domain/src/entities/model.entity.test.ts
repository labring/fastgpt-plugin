import { describe, expect, it } from 'vitest';

import { LLMModelItemSchema, ModelTypeEnum } from './model.entity';

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
