import type { HostEmitter } from '@fastgpt-plugin/helpers/events/type';
import type { SubPub } from './class';
import type { SystemVarType } from '@fastgpt-plugin/helpers/index';

export const createEventEmitter = (sp: SubPub, props: { systemVar: SystemVarType }) => {
  const eventEmiter: HostEmitter = {
    async uploadFile(data) {
      return sp.sendWithResponse('file-upload', {
        data,
        props
      });
    },
    async streamResponse(data) {
      return sp.send('stream-response', {
        data,
        props
      });
    }
  };

  return eventEmiter;
};
