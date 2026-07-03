import { consola } from 'consola/basic';

export const logger = consola;

export function shouldShowVerboseError(explicit?: boolean): boolean {
  return (
    explicit === true ||
    process.argv.includes('--verbose') ||
    process.env.FASTGPT_PLUGIN_CLI_VERBOSE === '1'
  );
}

export function formatCliError(error: unknown, verbose?: boolean): string | Error {
  if (shouldShowVerboseError(verbose)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  if (error instanceof Error) {
    return error.message || error.name;
  }

  return String(error);
}
