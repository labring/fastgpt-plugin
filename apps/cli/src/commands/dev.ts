import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import {
  type RemoteDebugCommandOptions,
  runRemoteDebugSession
} from '@fastgpt-plugin/cli/debug/remote-session';
import type { Command } from 'commander';

type DevCommandOptions = RemoteDebugCommandOptions;

export class DevCommand extends BaseCommand {
  public register(parent: Command): void {
    parent
      .command('dev [entries...]')
      .description('启动 FastGPT 插件集成开发会话')
      .option('--connect <url>', '可选：FastGPT debug connect link，适合脚本和 Agent')
      .option('--reconnect', '断线后自动重连', true)
      .option('--no-reconnect', '关闭自动重连')
      .option('--reconnect-interval-ms <ms>', '重连间隔')
      .option('--upload-dir <path>', '虚拟 uploadFile 的输出目录')
      .option('--watch', '监听插件文件变化并自动重载远程调试会话', false)
      .option('--no-interactive', '使用纯文本状态输出，适合脚本和 Agent')
      .action(async (entries: string[], opts: DevCommandOptions) => {
        await this.run(entries, opts);
      });
  }

  public async run(entriesInput: string | string[], options: DevCommandOptions): Promise<void> {
    await runRemoteDebugSession({
      entriesInput,
      options,
      commandName: 'dev'
    });
  }
}
