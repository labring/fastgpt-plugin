import type { EventEmitter, InvokeInput, InvokeOutput } from '@fastgpt-plugin/helpers/events/type';
import type { SubPub } from './class';
import type { SystemVarType } from '@fastgpt-plugin/helpers/index';
import type { InvokeTypeEnumType } from '@fastgpt-sdk/invoke';

export const createEventEmitter = (sp: SubPub, props: { systemVar: SystemVarType }) => {
  const eventEmiter: EventEmitter = {
    async uploadFile(data) {
      return sp.sendWithResponse('file-upload', {
        data,
        props
      });
    },
    async cherrio2md(data) {
      return sp.sendWithResponse('cherrio2md', {
        data,
        props
      });
    },
    async html2md(data) {
      return sp.sendWithResponse('html2md', {
        data,
        props
      });
    },
    async streamResponse(data) {
      return sp.send('stream-response', {
        data,
        props
      });
    },
    invoke<T extends InvokeTypeEnumType>(input: InvokeInput<T>) {
      return sp.sendWithResponse('invoke', {
        data: input,
        props
      }) as Promise<InvokeOutput<T>>;
    }
  };

  return eventEmiter;
};
