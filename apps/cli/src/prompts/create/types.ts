import type { CreatePluginCommandOptions } from '@fastgpt-plugin/cli/interfaces/command';

export type PluginType = CreatePluginCommandOptions['type'];

export type RawCreateCliOptions = {
  nameArg: string | undefined;
  typeFlag: string | undefined;
  descriptionFlag: string | undefined;
  cwd: string;
};
