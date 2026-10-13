import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { I18nStringSchema } from '@domain/value-objects/i18n-string.vo';

const TEMPLATE_DIR = fileURLToPath(new URL('./templates/', import.meta.url));
const TEMPLATE_NAMES = [
  'CQ',
  'Chinese',
  'TranslateRobot',
  'githubIssue',
  'google',
  'longTranslate',
  'srt-translate',
  'flux',
  'plugin-dalle',
  'plugin-feishu'
];
const LOCALIZED_FIELDS = [
  'label',
  'description',
  'placeholder',
  'toolDescription',
  'debugLabel',
  'valueDesc'
] as const;
const PLATFORM_KEY_PREFIXES = ['common:', 'core.', 'workflow:', 'app:'];
const PLATFORM_TRANSLATION_KEYS = new Set([
  'app:document_quote',
  'app:document_quote_tip',
  'app:workflow.read_files_result',
  'app:workflow.user_file_input',
  'app:workflow.user_file_input_desc',
  'common:core.module.Dataset quote.label',
  'common:core.module.input.description.HTTP Dynamic Input',
  'common:core.module.input.description.Http Request Header',
  'common:core.module.input.description.Http Request Url',
  'common:core.module.input.description.Response content',
  'common:core.module.input.label.user question',
  'common:core.module.output.label.Ai response content',
  'common:core.module.output.label.New context',
  'common:core.module.template.system_config',
  'common:core.module.template.system_config_info',
  'common:core.module.template.work_start',
  'core.ai.Prompt',
  'core.app.Chat Variable',
  'core.app.Question Guide',
  'core.app.Welcome Text',
  'core.app.tip.chatNodeSystemPromptTip',
  'core.app.tip.systemPromptTip',
  'core.module.Dataset quote.label',
  'core.module.input.description.Background',
  'core.module.input.description.HTTP Dynamic Input',
  'core.module.input.description.Http Request Header',
  'core.module.input.description.Http Request Url',
  'core.module.input.description.Response content',
  'core.module.input.label.Background',
  'core.module.input.label.Response content',
  'core.module.input.label.Select dataset',
  'core.module.input.label.aiModel',
  'core.module.input.label.chat history',
  'core.module.input.label.user question',
  'core.module.input.placeholder.Classify background',
  'core.module.output.description.Ai response content',
  'core.module.output.description.New context',
  'core.module.output.label.Ai response content',
  'core.module.output.label.New context',
  'workflow:execution_error',
  'workflow:filter_description',
  'workflow:full_response_data',
  'workflow:judgment_result',
  'workflow:max_dialog_rounds',
  'workflow:raw_response',
  'workflow:request_error',
  'workflow:these_variables_will_be_input_parameters_for_code_execution'
]);
const EXPECTED_MACHINE_SIGNATURES: Record<string, string> = {
  CQ: '4ad14918b0a9dd0e8e7a3fbc27b687da8065c7d75d5ac0dd80ede146798fecbc',
  Chinese: '967bc5e78ed47480bf365e64a3195cdefbedb47602c1314fac21d91550ee09ac',
  TranslateRobot: 'f7fece132e085887d7bf24432323a892235e3d99e4207dc87cf44cb79c2fc667',
  githubIssue: 'f255eb15c77b0152a28a5bfeeca766bff132e1be1ed30a57e56b8a5b896e5101',
  google: 'aa5e085293571355a3c7e5abeeacda2462660b5cb242460132f20aaec69abffa',
  longTranslate: 'fe83defbdab5e2cffcd1b476402f5ddaa37535b950918949cd7bff05b81932f9',
  'srt-translate': '93e40227c6a7fc43d207091ac1eead4313bd7e90aec0898ce6a376a0c8a7ca6a',
  flux: 'afb02b6eefc80fa9952bcc12194cff322d030568ecca458cdc90739fa00840c3',
  'plugin-dalle': 'de7dc992f19582db7bb0f5342e3e68be594dd86cdae1a1a265ecb2bc4128aee4',
  'plugin-feishu': '558f76bc80845bb7ccbff8d414d80efa5df42efe4e993db24abda1b683c4e915'
};

describe('static workflow template i18n coverage', () => {
  it('provides English and Simplified Chinese for every declared card, node, input and output string', async () => {
    for (const templateName of TEMPLATE_NAMES) {
      const template = JSON.parse(
        await readFile(path.join(TEMPLATE_DIR, templateName, 'workflow.json'), 'utf8')
      ) as Record<string, unknown>;

      expectLocalized(template.name, `${templateName}.name`);
      expectLocalized(template.intro, `${templateName}.intro`);

      const workflow = asRecord(template.workflow);
      const nodes = workflow['nodes'];
      expect(Array.isArray(nodes), `${templateName}.workflow.nodes`).toBe(true);

      for (const [nodeIndex, nodeValue] of (nodes as unknown[]).entries()) {
        const node = asRecord(nodeValue);
        const nodeId = String(node['nodeId'] ?? nodeIndex);
        expectLocalized(node['name'], `${templateName}.${nodeId}.name`);
        expectLocalized(node['intro'], `${templateName}.${nodeId}.intro`);

        for (const group of ['inputs', 'outputs'] as const) {
          const items = node[group];
          if (!Array.isArray(items)) continue;

          for (const [itemIndex, itemValue] of items.entries()) {
            const item = asRecord(itemValue);
            const itemId = String(item['key'] ?? item['id'] ?? itemIndex);
            expectLocalized(item['label'], `${templateName}.${nodeId}.${group}.${itemId}.label`);

            for (const field of LOCALIZED_FIELDS) {
              if (field in item) {
                expectLocalized(
                  item[field],
                  `${templateName}.${nodeId}.${group}.${itemId}.${field}`
                );
              }
            }
          }
        }
      }
    }
  });

  it('preserves platform translation keys and all non-localizable workflow graph data', async () => {
    for (const templateName of TEMPLATE_NAMES) {
      const template = JSON.parse(
        await readFile(path.join(TEMPLATE_DIR, templateName, 'workflow.json'), 'utf8')
      ) as Record<string, unknown>;
      const texts = collectLocalizedStrings(template);

      for (const text of texts) {
        const englishIsPlatformKey = PLATFORM_KEY_PREFIXES.some((prefix) => text.en.startsWith(prefix));
        const chineseIsPlatformKey = PLATFORM_KEY_PREFIXES.some((prefix) => text['zh-CN'].startsWith(prefix));
        if (englishIsPlatformKey || chineseIsPlatformKey) {
          expect(text.en, `${templateName} platform key in English`).toBe(text['zh-CN']);
          expect(PLATFORM_TRANSLATION_KEYS.has(text.en), `${templateName} platform key ${text.en}`).toBe(true);
        }
      }

      const signature = createHash('sha256')
        .update(JSON.stringify(getMachineConfiguration(template)))
        .digest('hex');
      expect(signature, `${templateName} machine configuration`).toBe(
        EXPECTED_MACHINE_SIGNATURES[templateName]
      );
    }
  });
});

function expectLocalized(value: unknown, location: string): void {
  expect(I18nStringSchema.safeParse(value).success, `${location} must be an I18nString`).toBe(true);
}

function getMachineConfiguration(template: Record<string, unknown>): Record<string, unknown> {
  const copy = structuredClone(template);
  delete copy['name'];
  delete copy['intro'];

  const workflow = asRecord(copy['workflow']);
  const nodes = workflow['nodes'];
  if (Array.isArray(nodes)) {
    for (const nodeValue of nodes) {
      const node = asRecord(nodeValue);
      delete node['name'];
      delete node['intro'];

      for (const group of ['inputs', 'outputs'] as const) {
        const items = node[group];
        if (!Array.isArray(items)) continue;

        for (const itemValue of items) {
          const item = asRecord(itemValue);
          const localizedFields = group === 'inputs'
            ? ['label', 'description', 'placeholder', 'toolDescription', 'debugLabel', 'valueDesc']
            : ['label', 'description', 'valueDesc'];
          for (const field of localizedFields) delete item[field];
          if (group === 'inputs' && isLocalizedText(item['value'])) {
            item['value'] = item['value']['zh-CN'];
          }
          if (group === 'inputs' && item['key'] === 'agents' && Array.isArray(item['value'])) {
            for (const optionValue of item['value']) {
              const option = asRecord(optionValue);
              if (isLocalizedText(option['value'])) option['value'] = option['value']['zh-CN'];
            }
          }
        }
      }
    }
  }

  const chatConfig = asRecord(workflow['chatConfig']);
  if (isLocalizedText(chatConfig['welcomeText'])) {
    chatConfig['welcomeText'] = chatConfig['welcomeText']['zh-CN'];
  }

  return copy;
}

function isLocalizedText(value: unknown): value is { en: string; 'zh-CN': string } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'en' in value &&
      'zh-CN' in value &&
      typeof value.en === 'string' &&
      typeof value['zh-CN'] === 'string'
  );
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function collectLocalizedStrings(value: unknown): Array<{ en: string; 'zh-CN': string }> {
  if (Array.isArray(value)) {
    return value.flatMap(collectLocalizedStrings);
  }
  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record['en'] === 'string' &&
    typeof record['zh-CN'] === 'string' &&
    Object.keys(record).every((key) => key === 'en' || key === 'zh-CN' || key === 'zh-Hant')
  ) {
    return [record as { en: string; 'zh-CN': string }];
  }

  return Object.values(record).flatMap(collectLocalizedStrings);
}
