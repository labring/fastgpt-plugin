import { DEFAULT_PLUGIN_DESCRIPTION, DEFAULT_PLUGIN_NAME } from '@fastgpt-plugin/cli/constants';
import type { CreatePluginCommandOptions } from '@fastgpt-plugin/cli/interfaces/command';
import type { IPrompt } from '@fastgpt-plugin/cli/prompts/base/types';
import type { RawCreateCliOptions, PluginType } from '@fastgpt-plugin/cli/prompts/create/types';
import { defaultDeps, type PromptDeps } from '@fastgpt-plugin/cli/prompts/create/deps';
import { inputPrompt } from '@fastgpt-plugin/cli/prompts/create/input-prompt';

export class CreatePrompt implements IPrompt<RawCreateCliOptions, CreatePluginCommandOptions> {
  private readonly deps: PromptDeps;

  constructor(deps: PromptDeps = defaultDeps) {
    this.deps = deps;
  }

  /**
   * 根据 CLI 传入的原始参数，交互式补全缺失字段，生成完整的 CreatePluginCommandOptions。
   * - 如果 name、type、description 都已提供，则不进入交互流程，直接返回
   * - 否则使用交互式 prompt 补全缺失部分
   */
  async run(input: RawCreateCliOptions): Promise<CreatePluginCommandOptions> {
    const getPluginType = () => {
      if (!input.typeFlag) return undefined;
      return input.typeFlag === 'tool-suite' ? 'tool-suite' : 'tool';
    };
    const pluginType = getPluginType();

    if (input.nameArg && pluginType && input.descriptionFlag !== undefined) {
      return {
        name: input.nameArg,
        cwd: input.cwd,
        type: pluginType,
        description: input.descriptionFlag
      };
    }

    const getPluginNameInputPrompt = async () => {
      return await inputPrompt(this.deps, {
        message: '插件名称',
        default: DEFAULT_PLUGIN_NAME
      });
    };
    const name = input.nameArg ?? (await getPluginNameInputPrompt());

    const getPluginTypeSelectPrompt = async () => {
      return await this.deps.select({
        message: '选择插件类型',
        choices: [
          {
            name: '单工具',
            value: 'tool' as const,
            description: '创建一个独立的工具'
          },
          {
            name: '工具集',
            value: 'tool-suite' as const,
            description: '创建一个包含多个子工具的工具集'
          }
        ]
      });
    };
    const type: PluginType = pluginType ?? (await getPluginTypeSelectPrompt());

    const getPluginDescriptionInputPrompt = async () => {
      return await inputPrompt(this.deps, {
        message: '插件描述',
        default: DEFAULT_PLUGIN_DESCRIPTION
      });
    };
    const description = input.descriptionFlag ?? (await getPluginDescriptionInputPrompt());

    return {
      name,
      cwd: input.cwd,
      type,
      description
    };
  }
}
