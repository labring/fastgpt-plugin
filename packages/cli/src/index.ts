#!/usr/bin/env node

import { logger } from '@fastgpt-plugin/cli/helpers';
import { run } from '@fastgpt-plugin/cli/cmd';

process.on('SIGINT', () => {
  process.exit(130);
});

const main = async () => {
  try {
    await run();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'ExitPromptError' ||
        error.message.includes('SIGINT') ||
        error.message.includes('force closed'))
    ) {
      process.exit(130);
    }

    logger.error(error);
    process.exitCode = 1;
  }
};

void main();
