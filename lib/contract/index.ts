import { z } from 'zod';
import { c } from './init';
import { toolContract } from '@tool/contract';
import { modelContract } from '@model/contract';
import { workflowContract } from '@workflow/contract';

export const contract = c.router(
  {
    tool: toolContract,
    model: modelContract,
    workflow: workflowContract
  },
  {
    baseHeaders: z.object({
      authtoken: z.string().optional()
    }),
    commonResponse: {
      401: z.object({
        error: z.string()
      }),
      404: z.object({
        error: z.string()
      }),
      500: z.object({
        error: z.string()
      })
    }
  }
);
