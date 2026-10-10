import type { ModerationHitType } from '@fastgpt-plugin/sdk-factory';
import { defineModeration, defineModerationManifest } from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

const SECRET_SCHEMA = z.object({
  blockedKeywords: z.string().optional().meta({
    title: 'Blocked keywords',
    description: 'Comma separated keywords that always block',
    isSecret: true
  }),
  suspiciousKeywords: z.string().optional().meta({
    title: 'Suspicious keywords',
    description: 'Comma separated keywords that make content suspected',
    isSecret: true
  })
});

function splitKeywords(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function matchKeywords(content: string, keywords: string[]): string[] {
  const normalizedContent = content.toLowerCase();
  return keywords.filter((keyword) => normalizedContent.includes(keyword.toLowerCase()));
}

/**
 * Create one hit for each matched keyword.
 * Use the normalised `other` label when keyword matching cannot identify a category,
 * and preserve the provider's own label in `providerLabel`.
 *
 * Hits have no verdict: the top-level `verdict` is authoritative; hits are review details.
 */
function toHit(keyword: string): ModerationHitType {
  return {
    label: 'other',
    providerLabel: 'keyword',
    keywords: [keyword]
  };
}

const moderation = defineModeration({
  manifest: defineModerationManifest({
    pluginId: '{{name}}',
    version: '1.0.0',
    name: {
      en: 'Keyword Moderation',
      'zh-CN': '关键词审查'
    },
    description: {
      en: 'Local keyword based content moderation for testing',
      'zh-CN': '本地关键词内容审查，用于测试'
    },
    versionDescription: {
      en: 'Initial version',
      'zh-CN': '初始版本'
    },
    meta: {
      provider: 'keyword'
    }
  }),
  secretSchema: SECRET_SCHEMA,
  provider: {
    name: 'keyword',
    check: async (input, ctx) => {
      const blocked = matchKeywords(input.content, splitKeywords(ctx.secrets.blockedKeywords));
      if (blocked.length > 0) {
        return {
          verdict: 'block',
          hits: blocked.map((keyword) => toHit(keyword))
        };
      }

      const suspicious = matchKeywords(
        input.content,
        splitKeywords(ctx.secrets.suspiciousKeywords)
      );
      if (suspicious.length > 0) {
        return {
          verdict: 'suspected',
          hits: suspicious.map((keyword) => toHit(keyword))
        };
      }

      return { verdict: 'pass', hits: [] };
    }
  }
});

export default moderation;
