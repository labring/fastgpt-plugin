import z from 'zod';
import { c } from '@/contract/init';
import { listToolContract } from './api/list';
import { getToolContract } from './api/getTool';
import { runToolContract } from './api/run';

export const toolContract = c.router(
  {
    list: listToolContract,
    getTool: getToolContract,
    run: runToolContract
  },
  {
    pathPrefix: '/tool',
    commonResponse: {
      '401': z.object({
        error: z.string()
      }),
      '404': z.object({
        error: z.string()
      }),
      '500': z.object({
        error: z.string()
      })
    }
  }
);
