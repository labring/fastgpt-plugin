import type { Command } from 'commander';

/**
 * CLI 子命令接口：负责向 Commander 注册自身（名称、描述、参数、action）。
 */
export interface ICommand {
  register(parent: Command): void;
}

export interface BaseCommandOptions {
  name: string;
  cwd: string;
}

export interface CreatePluginCommandOptions extends BaseCommandOptions {
  type: 'tool' | 'tool-suite';
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
}
