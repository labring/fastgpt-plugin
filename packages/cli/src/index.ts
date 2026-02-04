import { logger } from '@fastgpt-plugin/cli/helpers';
import { run } from '@fastgpt-plugin/cli/cmd';

const main = async () => {
  try {
    await run();
  } catch (error) {
    logger.error(error);
    process.exitCode = 1;
  }
};

if (import.meta.main) {
  void main();
}
