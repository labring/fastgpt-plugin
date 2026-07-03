import type {
  CreatePluginCommandOptions,
  TemplateDependencyMode
} from '@fastgpt-plugin/cli/interfaces/command';

export type PluginType = CreatePluginCommandOptions['type'];
export type DependencyMode = TemplateDependencyMode;

export type RawCreateCliOptions = {
  nameArg: string | undefined;
  typeFlag: string | undefined;
  descriptionFlag: string | undefined;
  dependencyModeFlag: string | undefined;
  cwd: string;
};
