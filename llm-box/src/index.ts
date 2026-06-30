import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';
import { spawn } from 'child_process';

const handler = createToolHandler({
  inputSchema: z.object({
    command: z.string().meta({
      title: 'Command',
      description: 'The llm-box command to execute. Example: "run examples/basic_summary.yaml" or "create fetch example.com and summarize"'
    } satisfies InputSchemaMetaType),
    workingDir: z.string().optional().meta({
      title: 'Working Directory',
      description: 'Optional working directory for the command (absolute path)'
    } satisfies InputSchemaMetaType),
    timeout: z.number().optional().meta({
      title: 'Timeout (seconds)',
      description: 'Maximum execution time in seconds. Default: 120'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    success: z.boolean().meta({
      title: 'Success',
      description: 'Whether the command executed successfully'
    }),
    output: z.string().meta({
      title: 'Output',
      description: 'The stdout/stderr output from the command'
    }),
    exitCode: z.number().meta({
      title: 'Exit Code',
      description: 'The exit code of the command'
    })
  } satisfies OutputSchemaMetaType),
  handler: async (input, _ctx) => {
    return new Promise((resolve) => {
      const timeout = (input.timeout || 120) * 1000;
      const workingDir = input.workingDir || process.cwd();

      // Build the llm-box command
      const args = input.command.trim().split(/\s+/);

      const proc = spawn('llm-box', args, {
        cwd: workingDir,
        env: { ...process.env },
        shell: true
      });

      let output = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout
      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({
          success: false,
          output: output + '\n[TIMEOUT] Command execution timed out after ' + timeout / 1000 + ' seconds',
          exitCode: 124
        });
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timer);
        const exitCode = code ?? 0;
        resolve({
          success: exitCode === 0,
          output: output + (stderr ? '\n[STDERR]\n' + stderr : ''),
          exitCode
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output: '[ERROR] Failed to execute command: ' + err.message,
          exitCode: 1
        });
      });
    });
  }
});

const tool = defineTool({
  manifest: {
    description: {
      en: 'Execute llm-box workflows and commands from the terminal. llm-box is a terminal-first AI workflow engine that can run YAML workflows, create workflows from natural language, and execute various AI tasks.',
      'zh-CN': '从终端执行 llm-box 工作流和命令。llm-box 是一个终端优先的 AI 工作流引擎，可以运行 YAML 工作流、从自然语言创建工作流，并执行各种 AI 任务。'
    },
    name: {
      en: 'llm-box',
      'zh-CN': 'llm-box 工作流执行'
    },
    pluginId: 'llm-box',
    version: '1.0.0',
    versionDescription: {
      en: 'Initial version - Execute llm-box workflows and commands',
      'zh-CN': '初始版本 - 执行 llm-box 工作流和命令'
    },
    tags: ['tools', 'productivity']
  },
  handler
});

export default tool;
