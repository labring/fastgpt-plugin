import type { Command } from 'commander';
import type { ICommand } from '@fastgpt-plugin/cli/interfaces/command';
import type { APICapabilitiesContext } from '@fastgpt-plugin/cli/interfaces/context';
import { createDefaultAPICapabilitiesContext } from '@fastgpt-plugin/cli/runtime/context';

/**
 * 所有子命令的基类：
 * - 提供统一的 APICapabilitiesContext 注入与默认实现
 * - 强制实现 register 方法，用于向 Commander 注册自身
 */
export abstract class BaseCommand implements ICommand {
  protected readonly ctx: APICapabilitiesContext;

  constructor(context?: APICapabilitiesContext) {
    this.ctx = context ?? createDefaultAPICapabilitiesContext();
  }

  abstract register(parent: Command): void;
}
