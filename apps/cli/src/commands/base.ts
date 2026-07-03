import type { ICommand } from '@fastgpt-plugin/cli/interfaces/command';
import type { Command } from 'commander';

/**
 * 所有子命令的基类：
 * - 统一命令接口类型
 * - 强制实现 register 方法，用于向 Commander 注册自身
 */
export abstract class BaseCommand implements ICommand {
  abstract register(parent: Command): void;

  protected addCommonOptions(command: Command): Command {
    return command.option('--verbose', '显示完整错误堆栈 / Show full error stack');
  }
}
