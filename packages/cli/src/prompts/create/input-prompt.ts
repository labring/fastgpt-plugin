import type { PromptDeps } from '@fastgpt-plugin/cli/prompts/create/deps';

export async function inputPrompt(
  deps: PromptDeps,
  options: { message: string; default?: string }
): Promise<string> {
  return deps.input({
    ...options,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return '请输入有效的内容';
      }
      return true;
    }
  });
}
