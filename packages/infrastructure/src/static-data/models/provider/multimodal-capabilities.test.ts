import { describe, expect, it } from 'vitest';

import {
  type LLMModelItemType,
  ModelItemSchema,
  ModelTypeEnum
} from '@domain/entities/model.entity';

import doubao from './Doubao';
import gemini from './Gemini';
import qwen from './Qwen';

const staticModelList = [gemini, qwen, doubao].flatMap((provider) =>
  provider.list.map((model) =>
    ModelItemSchema.parse({
      ...model,
      provider: provider.provider,
      name: model.name ?? model.model
    })
  )
);

const getModel = (provider: string, model: string) =>
  staticModelList.find((item) => item.provider === provider && item.model === model);

describe('static model multimodal capabilities', () => {
  it('marks Gemini LLMs as supporting image, audio, and video inputs', () => {
    const llms = staticModelList.filter(
      (item): item is LLMModelItemType =>
        item.provider === 'Gemini' && item.type === ModelTypeEnum.llm
    );

    expect(llms).not.toHaveLength(0);
    expect(llms.every((model) => model.vision && model.audio && model.video)).toBe(true);
  });

  it('marks Qwen visual models with their video input capability', () => {
    expect(getModel('Qwen', 'qwen3.7-max')).toMatchObject({
      vision: true,
      video: true
    });
    expect(getModel('Qwen', 'qwen3.7-plus')).toMatchObject({
      vision: true,
      video: true
    });
    expect(getModel('Qwen', 'qwen3-vl-plus')).toMatchObject({
      vision: true,
      video: true
    });
    expect(getModel('Qwen', 'qwen-vl-max')).toMatchObject({
      vision: true,
      video: true
    });
    expect(getModel('Qwen', 'qwen3-max')).toMatchObject({ vision: false });
  });

  it('distinguishes Doubao audio-capable versions from video-only versions', () => {
    expect(getModel('Doubao', 'doubao-seed-evolving')).toMatchObject({
      vision: true,
      video: true
    });
    expect(getModel('Doubao', 'doubao-seed-2-0-lite-260428')).toMatchObject({
      vision: true,
      audio: true,
      video: true
    });
    expect(getModel('Doubao', 'doubao-seed-2-0-mini-260428')).toMatchObject({
      vision: true,
      audio: true,
      video: true
    });
    expect(getModel('Doubao', 'doubao-seed-2-0-pro-260215')).not.toHaveProperty('audio');
  });
});
