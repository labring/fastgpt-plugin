import { z } from 'zod';
import { c } from './init';
import { toolContract } from '@tool/contract';
import { modelContract } from 'modules/model/contract';

export const contract = c.router(
  {
    tool: toolContract,
    model: modelContract
  },
  {
    baseHeaders: z.object({
      authtoken: z.string().optional()
    })
  }
);
