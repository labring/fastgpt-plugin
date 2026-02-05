import { z } from 'zod';
import { SystemVarSchema } from '@fastgpt-plugin/helpers/tools/schemas/req';

export const getMockSystemVar = (
  systemVar: z.infer<typeof SystemVarSchema>
): z.infer<typeof SystemVarSchema> => {
  return {
    app: systemVar.app ?? {
      id: 'test-appId',
      name: 'test-appName'
    },
    time: systemVar.time ?? new Date(),
    user: systemVar.user ?? {
      id: 'test-userId',
      name: 'test-userName',
      avatar: 'test-userAvatar'
    },
    tool: systemVar.tool ?? {
      id: 'test-toolId',
      version: 'test-toolVersion'
    }
  };
};
