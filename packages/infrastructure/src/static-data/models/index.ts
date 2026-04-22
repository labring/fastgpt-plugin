import { fileURLToPath } from 'node:url';

import { ModelItemSchema, type ModelItemType, ModelTypeEnum } from '@domain/entities/model.entity';
import type { I18nStringStrictType } from '@domain/value-objects/i18n-string.vo';

import ai360 from './provider/ai360';
import alicloud from './provider/AliCloud';
import baai from './provider/BAAI';
import baichuan from './provider/Baichuan';
import chatglm from './provider/ChatGLM';
import claude from './provider/Claude';
import deepseek from './provider/DeepSeek';
import doubao from './provider/Doubao';
import ernie from './provider/Ernie';
import fishaudio from './provider/FishAudio';
import gemini from './provider/Gemini';
import grok from './provider/Grok';
import groq from './provider/Groq';
import huggingface from './provider/HuggingFace';
import hunyuan from './provider/Hunyuan';
import internlm from './provider/InternLM';
import jina from './provider/Jina';
import meta from './provider/Meta';
import minimax from './provider/MiniMax';
import mistralai from './provider/MistralAI';
import moka from './provider/Moka';
import moonshot from './provider/Moonshot';
import novita from './provider/novita';
import ollama from './provider/Ollama';
import openai from './provider/OpenAI';
import openrouter from './provider/OpenRouter';
import other from './provider/Other';
import ppio from './provider/PPIO';
import qwen from './provider/Qwen';
import siliconflow from './provider/Siliconflow';
import sparkdesk from './provider/SparkDesk';
import stepfun from './provider/StepFun';
import yi from './provider/Yi';
import { aiproxyIdMap, ModelProviderMap, ModelProviders } from './model';
import type { ProviderConfigType } from './type';

export const staticModelDataDir = fileURLToPath(new URL('./', import.meta.url));
export const staticModelProviderDir = fileURLToPath(new URL('./provider/', import.meta.url));

export const staticModelProviderConfigs: ProviderConfigType[] = [
  ai360,
  alicloud,
  baai,
  baichuan,
  chatglm,
  claude,
  deepseek,
  doubao,
  ernie,
  fishaudio,
  gemini,
  grok,
  groq,
  huggingface,
  hunyuan,
  internlm,
  jina,
  meta,
  minimax,
  mistralai,
  moka,
  moonshot,
  novita,
  ollama,
  openai,
  openrouter,
  other,
  ppio,
  qwen,
  siliconflow,
  sparkdesk,
  stepfun,
  yi
];

const fallbackProviderName = (provider: string): I18nStringStrictType => ({
  en: provider,
  'zh-CN': provider,
  'zh-Hant': provider
});

export const getSortedStaticModelProviders = (priority = '') => {
  const providers = new Map(ModelProviders.map((item) => [item.provider, item] as const));

  for (const item of staticModelProviderConfigs) {
    if (!providers.has(item.provider)) {
      providers.set(item.provider, {
        provider: item.provider,
        value:
          ModelProviderMap[item.provider as keyof typeof ModelProviderMap] ??
          fallbackProviderName(item.provider)
      });
    }
  }

  return [...providers.values()].sort(({ provider: a }, { provider: b }) => {
    if (!priority) return 0;

    const aPrioritized = priority.includes(a);
    const bPrioritized = priority.includes(b);

    if (aPrioritized && !bPrioritized) return -1;
    if (!aPrioritized && bPrioritized) return 1;
    return 0;
  });
};

export const staticModelList: ModelItemType[] = staticModelProviderConfigs.flatMap((item) =>
  item.list.map((model) =>
    ModelItemSchema.parse({
      ...(model.type === ModelTypeEnum.llm && {
        showTopP: true,
        showStopSign: true,
        datasetProcess: true,
        usedInClassify: true,
        usedInExtractFields: true,
        usedInToolCall: true,
        useInEvaluation: true
      }),
      ...model,
      provider: item.provider,
      name: model.name ?? model.model
    })
  )
);

export { aiproxyIdMap, ModelProviderMap, ModelProviders };
