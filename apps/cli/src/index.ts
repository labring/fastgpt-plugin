#!/usr/bin/env node

import { run } from '@fastgpt-plugin/cli/cmd';
import { formatCliError, logger } from '@fastgpt-plugin/cli/helpers';

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

    logger.error(formatCliError(error));
    process.exitCode = 1;
  }
};

void main();
