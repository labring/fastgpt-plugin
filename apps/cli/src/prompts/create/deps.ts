import { input, select } from '@inquirer/prompts';

export type PromptDeps = {
  input: typeof input;
  select: typeof select;
};

export const defaultDeps: PromptDeps = {
  input,
  select
};
