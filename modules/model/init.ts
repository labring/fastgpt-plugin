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
import hunyuan from './provider/Hunyuan';
import intern from './provider/InternLM';
import jina from './provider/Jina';
import meta from './provider/Meta';
import minimax from './provider/MiniMax';
import mistralai from './provider/MistralAI';
import moka from './provider/Moka';
import moonshot from './provider/Moonshot';
import ollama from './provider/Ollama';
import openai from './provider/OpenAI';
import other from './provider/Other';
import ppio from './provider/PPIO';
import qwen from './provider/Qwen';
import siliconflow from './provider/Siliconflow';
import sparkdesk from './provider/SparkDesk';
import stepfun from './provider/StepFun';
import yi from './provider/Yi';
import ai360 from './provider/ai360';
import huggingface from './provider/HuggingFace';
import novita from './provider/novita';
import openrouter from './provider/OpenRouter';

import { ModelItemSchema, ModelTypeEnum, type ProviderConfigType } from './type';
import { modelsBuffer } from './constants';
import { addLog } from '@/utils/log';

// All providers array in alphabetical order
const allProviders: ProviderConfigType[] = [
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
  intern,
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

export const initModels = () => {
  modelsBuffer.data = allProviders
    .map((item) => {
      return item.list.map((model) => {
        return ModelItemSchema.parse({
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
          name: model.model
        });
      });
    })
    .flat();

  addLog.info(`Load system model success, total ${modelsBuffer.data.length} models`);
};
