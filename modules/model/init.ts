import alicloud from './provider/alicloud';
import baai from './provider/baai';
import baichuan from './provider/baichuan';
import chatglm from './provider/chatglm';
import claude from './provider/claude';
import deepseek from './provider/deepseek';
import doubao from './provider/doubao';
import ernie from './provider/ernie';
import fishaudio from './provider/fishaudio';
import gemini from './provider/gemini';
import grok from './provider/grok';
import groq from './provider/groq';
import hunyuan from './provider/hunyuan';
import intern from './provider/intern';
import jina from './provider/jina';
import meta from './provider/meta';
import minimax from './provider/minimax';
import mistralai from './provider/mistralai';
import moka from './provider/moka';
import moonshot from './provider/moonshot';
import ollama from './provider/ollama';
import openai from './provider/openai';
import other from './provider/other';
import ppio from './provider/ppio';
import qwen from './provider/qwen';
import siliconflow from './provider/siliconflow';
import sparkdesk from './provider/sparkdesk';
import stepfun from './provider/stepfun';
import yi from './provider/yi';

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
