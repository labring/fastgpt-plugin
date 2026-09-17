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
 * 每条命中一个 hit，只给出「哪个词」「provider 对该项的判定」。
 * label 取归一化标签 `other`（关键词匹配无法映射到更细的类别），
 * providerLabel 保留 provider 自己的标签原文。
 */
function toHit(keyword: string, verdict: ModerationHitType['verdict']): ModerationHitType {
  return {
    label: 'other',
    providerLabel: 'keyword',
    verdict,
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
      provider: 'keyword',
      modalities: ['text']
    }
  }),
  secretSchema: SECRET_SCHEMA,
  provider: {
    name: 'keyword',
    modalities: ['text'],
    check: async (input, ctx) => {
      const blocked = matchKeywords(input.content, splitKeywords(ctx.secrets.blockedKeywords));
      if (blocked.length > 0) {
        return {
          verdict: 'block',
          hits: blocked.map((keyword) => toHit(keyword, 'block'))
        };
      }

      const suspicious = matchKeywords(
        input.content,
        splitKeywords(ctx.secrets.suspiciousKeywords)
      );
      if (suspicious.length > 0) {
        return {
          verdict: 'suspected',
          hits: suspicious.map((keyword) => toHit(keyword, 'suspected'))
        };
      }

      return { verdict: 'pass', hits: [] };
    }
  }
});

export default moderation;
