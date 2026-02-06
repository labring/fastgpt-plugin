import { Command } from 'commander';
import { CLI_NAME, CLI_VERSION } from '@fastgpt-plugin/cli/constants';
import { BuildCommand } from '@fastgpt-plugin/cli/commands/build';
import { CreateCommand } from '@fastgpt-plugin/cli/commands/create';
import { PackCommand } from '@fastgpt-plugin/cli/commands/pack';

function createProgram(): Command {
  const program = new Command();

  program.name(CLI_NAME).version(CLI_VERSION).description('FastGPT 插件开发 CLI');

  new BuildCommand().register(program);
  new CreateCommand().register(program);
  new PackCommand().register(program);

  return program;
}

/**
 * 运行 CLI，解析 process.argv。
 * @param argv 可选，用于测试时注入参数（如 ['node', 'cli', '--version']）
 */
export async function run(argv?: string[]): Promise<void> {
  await createProgram().parseAsync(argv ?? process.argv);

  return;
}
