import { describe, expect, it } from 'vitest';

import {
  type LLMModelItemType,
  ModelItemSchema,
  ModelTypeEnum
} from '@domain/entities/model.entity';

import antling from './AntLing';
import chatglm from './ChatGLM';
import doubao from './Doubao';
import gemini from './Gemini';
import hunyuan from './Hunyuan';
import openai from './OpenAI';
import qwen from './Qwen';
import sparkdesk from './SparkDesk';

const staticModelList = [antling, chatglm, doubao, gemini, hunyuan, openai, qwen, sparkdesk].flatMap((provider) =>
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
  it('marks Ant Ling Ling-3.0-flash-VL with its documented multimodal limits', () => {
    expect(getModel('AntLing', 'Ling-3.0-flash-VL')).toMatchObject({
      maxContext: 256000,
      maxTokens: 102400,
      responseFormatList: ['text', 'json_object', 'json_schema'],
      vision: true,
      video: true,
      reasoning: false,
      reasoningEffort: false,
      toolChoice: true
    });
  });

  it('marks Gemini LLMs as supporting image, audio, and video inputs', () => {
    const llms = staticModelList.filter(
      (item): item is LLMModelItemType =>
        item.provider === 'Gemini' && item.type === ModelTypeEnum.llm
    );

    expect(llms).not.toHaveLength(0);
    expect(llms.every((model) => model.vision && model.audio && model.video)).toBe(true);
  });

  it('marks Gemini 3.8 Flash with its documented limits and agent capabilities', () => {
    expect(getModel('Gemini', 'gemini-3.8-flash')).toMatchObject({
      maxContext: 1048576,
      maxTokens: 65536,
      vision: true,
      audio: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    });
  });

  it('marks Qwen visual models with their video input capability', () => {
    expect(getModel('Qwen', 'qwen3.8-flash')).toMatchObject({
      maxContext: 1000000,
      maxTokens: 64000,
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    });
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

  it('marks GLM-5.3-Flash with its multimodal and agent capabilities', () => {
    expect(getModel('ChatGLM', 'glm-5.3-flash')).toMatchObject({
      maxContext: 1000000,
      maxTokens: 128000,
      responseFormatList: ['text', 'json_object'],
      vision: true,
      video: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true
    });
  });

  it('marks GPT-6 Astra with its documented limits and agent capabilities', () => {
    expect(getModel('OpenAI', 'gpt-6-astra')).toMatchObject({
      maxContext: 1050000,
      maxTokens: 128000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      responseFormatList: ['text', 'json_schema']
    });
  });

  it('marks GPT-5.3 Codex with its documented limits and coding capabilities', () => {
    expect(getModel('OpenAI', 'gpt-5.3-codex')).toMatchObject({
      maxContext: 400000,
      maxTokens: 128000,
      vision: true,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      responseFormatList: ['text', 'json_schema']
    });
  });

  it('marks Hy4 preview with its documented limits and agent capabilities', () => {
    expect(getModel('Hunyuan', 'hy4-preview')).toMatchObject({
      maxContext: 1024000,
      maxTokens: 64000,
      vision: false,
      reasoning: true,
      reasoningEffort: true,
      toolChoice: true,
      responseFormatList: ['text', 'json_object', 'json_schema']
    });
  });

  it('marks Spark X2 with its reasoning and tool capabilities', () => {
    expect(getModel('SparkDesk', 'spark-x')).toMatchObject({
      maxContext: 262144,
      maxTokens: 262144,
      reasoning: true,
      reasoningEffort: false,
      toolChoice: true
    });
  });
});
