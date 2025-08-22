import alicloud from './provider/AliCloud/alicloud';
import baai from './provider/BAAI/baai';
import baichuan from './provider/Baichuan/baichuan';
import chatglm from './provider/ChatGLM/chatglm';
import claude from './provider/Claude/claude';
import deepseek from './provider/DeepSeek/deepseek';
import doubao from './provider/Doubao/doubao';
import ernie from './provider/Ernie/ernie';
import fishaudio from './provider/FishAudio/fishaudio';
import gemini from './provider/Gemini/gemini';
import grok from './provider/Grok/grok';
import groq from './provider/Groq/groq';
import hunyuan from './provider/Hunyuan/hunyuan';
import intern from './provider/InternLM/intern';
import jina from './provider/Jina/jina';
import meta from './provider/Meta/meta';
import minimax from './provider/MiniMax/minimax';
import mistralai from './provider/MistralAI/mistralai';
import moka from './provider/Moka/moka';
import moonshot from './provider/Moonshot/moonshot';
import ollama from './provider/Ollama/ollama';
import openai from './provider/OpenAI/openai';
import other from './provider/Other/other';
import ppio from './provider/PPIO/ppio';
import qwen from './provider/Qwen/qwen';
import siliconflow from './provider/Siliconflow/siliconflow';
import sparkdesk from './provider/SparkDesk/sparkdesk';
import stepfun from './provider/StepFun/stepfun';
import yi from './provider/Yi/yi';

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
