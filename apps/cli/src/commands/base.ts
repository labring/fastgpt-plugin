import type { Command } from 'commander';
import type { ICommand } from '@fastgpt-plugin/cli/interfaces/command';

/**
 * 所有子命令的基类：
 * - 统一命令接口类型
 * - 强制实现 register 方法，用于向 Commander 注册自身
 */
export abstract class BaseCommand implements ICommand {
  abstract register(parent: Command): void;
}
