import type { Logger } from '../../logger';

declare global {
  type Env = {
    Variables: {
      logger: Logger;
      requestId: string;
    };
  };
}
