import type { EventEmitter } from '@fastgpt-plugin/helpers/events/type';
import type { SubPub } from './class';

export const createEventEmitter = (sp: SubPub) => {
  const eventEmiter: EventEmitter = {
    async uploadFile(data) {
      return sp.sendWithResponse('file-upload', data);
    },
    async cherrio2md(data) {
      return sp.sendWithResponse('cherrio2md', data);
    },
    async html2md(data) {
      return sp.sendWithResponse('html2md', data);
    },
    async streamResponse(data) {
      return sp.send('stream-response', data);
    }
  };

  return eventEmiter;
};
