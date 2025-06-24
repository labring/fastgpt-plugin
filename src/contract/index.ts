import { z } from 'zod';
import { c } from './init';
import { toolContract } from '@tool/contract';

export const contract = c.router(
  {
    tool: toolContract
  },
  {
    baseHeaders: z.object({
      authtoken: z.string().optional()
    })
  }
);
