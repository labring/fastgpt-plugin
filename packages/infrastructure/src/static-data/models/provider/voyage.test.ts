import { describe, expect, it } from 'vitest';

import { ModelItemSchema, ModelTypeEnum } from '@domain/entities/model.entity';

import voyage from './Voyage';

const models = voyage.list.map((model) =>
  ModelItemSchema.parse({ ...model, provider: voyage.provider, name: model.name ?? model.model })
);

describe('Voyage static models', () => {
  it('lists every model once', () => {
    const ids = voyage.list.map((model) => model.model);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tags stored chunks as documents and search queries as queries', () => {
    const embeddings = models.filter((model) => model.type === ModelTypeEnum.embedding);

    expect(embeddings).not.toHaveLength(0);
    for (const model of embeddings) {
      expect(model.dbConfig).toEqual({ input_type: 'document' });
      expect(model.queryConfig).toEqual({ input_type: 'query' });
    }
  });

  it('gives contextualized models a default input_type, as Voyage rejects them without one', () => {
    const contextual = models.filter((model) => model.model.startsWith('voyage-context-'));

    expect(contextual.map((model) => model.model).sort()).toEqual([
      'voyage-context-3',
      'voyage-context-4'
    ]);
    for (const model of contextual) {
      expect(model).toMatchObject({ defaultConfig: { input_type: 'document' }, maxToken: 30000 });
    }
  });

  it('only marks the multimodal models as accepting images', () => {
    const vision = models
      .filter((model) => model.type === ModelTypeEnum.embedding && model.vision)
      .map((model) => model.model);

    expect(vision.sort()).toEqual(['voyage-multimodal-3', 'voyage-multimodal-3.5']);
  });

  it('keeps the shorter law-2 context and the recommended rerankers', () => {
    const byId = new Map(models.map((model) => [model.model, model]));

    expect(byId.get('voyage-law-2')).toMatchObject({ maxToken: 16000 });
    expect(byId.get('voyage-4')).toMatchObject({ maxToken: 32000 });
    expect(byId.get('rerank-3')).toMatchObject({ type: ModelTypeEnum.rerank, maxToken: 32000 });
    expect(byId.get('rerank-3-lite')).toMatchObject({ type: ModelTypeEnum.rerank });
  });
});
