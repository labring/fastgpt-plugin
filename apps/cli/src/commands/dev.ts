import { BaseCommand } from '@fastgpt-plugin/cli/commands/base';
import {
  type RemoteDebugCommandOptions,
  runRemoteDebugSession
} from '@fastgpt-plugin/cli/debug/remote-session';
import type { Command } from 'commander';

type DevCommandOptions = RemoteDebugCommandOptions;

export class DevCommand extends BaseCommand {
  public register(parent: Command): void {
    const command = this.addCommonOptions(
      parent
        .command('dev [entries...]')
        .description('Start remote FastGPT integration debugging / 启动 FastGPT 插件集成开发会话')
        .option('--connect <keyOrUrl>', 'FastGPT debug connection key 或 connect link')
        .option('--reconnect', '断线后自动重连 / Reconnect after disconnect', true)
        .option('--no-reconnect', '关闭自动重连 / Disable reconnect')
        .option('--reconnect-interval-ms <ms>', '重连间隔 / Reconnect interval')
        .option('--upload-dir <path>', '虚拟 uploadFile 的输出目录 / virtual uploadFile output directory')
        .option('--watch', '监听插件文件变化并自动重载远程调试会话 / Watch and hot reload plugins', false)
        .option('--no-interactive', '使用纯文本状态输出，适合脚本和 Agent')
    );

    command.action(async (entries: string[], opts: DevCommandOptions) => {
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
