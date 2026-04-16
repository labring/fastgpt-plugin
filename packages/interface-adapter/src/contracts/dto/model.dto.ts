import { z } from '@hono/zod-openapi';

import { ModelItemSchema } from '@domain/entities/model.entity';

import { I18nStringStrictDTOSchema } from './common.dto';

export const ModelListDTOSchema = z.array(ModelItemSchema).openapi({
  description: 'Available model list'
});

export const ModelProviderItemDTOSchema = z.object({
  provider: z.string().openapi({
    description: 'Model provider id',
    example: 'OpenAI'
  }),
  value: I18nStringStrictDTOSchema.openapi({
    description: 'Model provider display name'
  }),
  avatar: z.string().openapi({
    description: 'Model provider logo url',
    example: 'https://example.com/models/OpenAI/logo'
  })
});

export const AiproxyMapProviderItemDTOSchema = z.object({
  name: I18nStringStrictDTOSchema.openapi({
    description: 'AIProxy provider display name'
  }),
  provider: z.string().optional().openapi({
    description: 'Mapped model provider id',
    example: 'OpenAI'
  }),
  avatar: z.string().optional().openapi({
    description: 'Custom avatar url'
  })
});

export const ModelProviderListDTOSchema = z.object({
  modelProviders: z.array(ModelProviderItemDTOSchema).openapi({
    description: 'Model provider list'
  }),
  aiproxyIdMap: z.record(z.string(), AiproxyMapProviderItemDTOSchema).openapi({
    description: 'AIProxy provider mapping'
  })
});

export type ModelListDTOType = z.infer<typeof ModelListDTOSchema>;
export type ModelProviderItemDTOType = z.infer<typeof ModelProviderItemDTOSchema>;
export type AiproxyMapProviderItemDTOType = z.infer<typeof AiproxyMapProviderItemDTOSchema>;
export type ModelProviderListDTOType = z.infer<typeof ModelProviderListDTOSchema>;
