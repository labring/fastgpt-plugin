import type { Logger } from '@infrastructure/logger';

declare global {
  type Env = {
    Variables: {
      logger: Logger;
      requestId: string;
    };
  };
}
