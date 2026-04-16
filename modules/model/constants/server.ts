// Server-side constants - depend on env, should not be imported in SDK bundles
import type { ListModelsType } from '../api/type';
import { env } from '@/env';
import {
  ModelProviders,
  aiproxyChannels,
  type ModelProviderItem,
  type AIProxyChannelsType
} from './shared';

export const modelsBuffer: {
  data: ListModelsType;
} = {
  data: []
};

/**
 * Stable priority sort: items whose key is in `priority` come first in priority order;
 * remaining items keep their original order.
 */
const sortByPriority = <T>(items: T[], priority: string[], getKey: (item: T) => string): T[] => {
  if (priority.length === 0) return items.slice();
  const rank = new Map(priority.map((key, idx) => [key, idx]));
  const head: T[] = [];
  const tail: T[] = [];
  for (const item of items) {
    if (rank.has(getKey(item))) head.push(item);
    else tail.push(item);
  }
  head.sort((a, b) => rank.get(getKey(a))! - rank.get(getKey(b))!);
  return [...head, ...tail];
};

const parsePriority = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const ModelProvidersSorted: ModelProviderItem[] = sortByPriority(
  ModelProviders,
  parsePriority(env.MODEL_PROVIDER_PRIORITY),
  (p) => p.provider
);

export const aiproxyChannelsSorted: AIProxyChannelsType = sortByPriority(
  aiproxyChannels,
  parsePriority(env.MODEL_CHANNEL_PRIORITY),
  (c) => String(c.channelId)
);
