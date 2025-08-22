import alicloud from './provider/AliCloud/index';
import baai from './provider/BAAI/index';
import baichuan from './provider/Baichuan/index';
import chatglm from './provider/ChatGLM/index';
import claude from './provider/Claude/index';
import deepseek from './provider/DeepSeek/index';
import doubao from './provider/Doubao/index';
import ernie from './provider/Ernie/index';
import fishaudio from './provider/FishAudio/index';
import gemini from './provider/Gemini/index';
import grok from './provider/Grok/index';
import groq from './provider/Groq/index';
import hunyuan from './provider/Hunyuan/index';
import intern from './provider/InternLM/index';
import jina from './provider/Jina/index';
import meta from './provider/Meta/index';
import minimax from './provider/MiniMax/index';
import mistralai from './provider/MistralAI/index';
import moka from './provider/Moka/index';
import moonshot from './provider/Moonshot/index';
import ollama from './provider/Ollama/index';
import openai from './provider/OpenAI/index';
import other from './provider/Other/index';
import ppio from './provider/PPIO/index';
import qwen from './provider/Qwen/index';
import siliconflow from './provider/Siliconflow/index';
import sparkdesk from './provider/SparkDesk/index';
import stepfun from './provider/StepFun/index';
import yi from './provider/Yi/index';

import { ModelItemSchema, ModelTypeEnum, type ProviderConfigType } from './type';
import { modelsBuffer } from './constants';
import { addLog } from '@/utils/log';

// All providers array in alphabetical order
const allProviders: ProviderConfigType[] = [
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
  hunyuan,
  intern,
  jina,
  meta,
  minimax,
  mistralai,
  moka,
  moonshot,
  ollama,
  openai,
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
