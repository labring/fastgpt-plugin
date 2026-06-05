import { z } from 'zod';

import { ModelItemSchema } from '@domain/entities/model.entity';

import { I18nStringStrictDTOSchema } from './common.dto';

export const ModelListDTOSchema = z.array(ModelItemSchema);

export const ModelProviderItemDTOSchema = z.object({
  provider: z.string(),
  value: I18nStringStrictDTOSchema,
  avatar: z.string()
});

export const AIProxyChannelItemDTOSchema = z.object({
  channelId: z.number(),
  name: I18nStringStrictDTOSchema,
  avatar: z.string()
});

export const ModelProviderListDTOSchema = z.object({
  modelProviders: z.array(ModelProviderItemDTOSchema),
  aiproxyChannels: z.array(AIProxyChannelItemDTOSchema)
});

export type ModelListDTOType = z.infer<typeof ModelListDTOSchema>;
export type ModelProviderItemDTOType = z.infer<typeof ModelProviderItemDTOSchema>;
export type AIProxyChannelItemDTOType = z.infer<typeof AIProxyChannelItemDTOSchema>;
export type ModelProviderListDTOType = z.infer<typeof ModelProviderListDTOSchema>;
