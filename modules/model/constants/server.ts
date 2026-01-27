// Server-side constants - depend on env, should not be imported in SDK bundles
import type { I18nStringStrictType } from '@/type/i18n';
import type { ListModelsType } from '../api/type';
import { env } from '@/env';
import { ModelProviderMap } from './shared';

export const modelsBuffer: {
  data: ListModelsType;
} = {
  data: []
};

// Server-side sorted version with env-based priority
export const ModelProvidersSorted = Object.entries(ModelProviderMap)
  .map(([key, value]) => ({
    provider: key,
    value: value as I18nStringStrictType
  }))
  .sort(({ provider: a }, { provider: b }) => {
    const priorityProvider = env.MODEL_PROVIDER_PRIORITY;
    if (!priorityProvider) return 0;

    const aProvider = priorityProvider.includes(a);
    const bProvider = priorityProvider.includes(b);

    if (aProvider && !bProvider) return -1;
    if (!aProvider && bProvider) return 1;
    return 0;
  });
