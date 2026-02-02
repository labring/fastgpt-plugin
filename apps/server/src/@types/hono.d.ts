import type { Logger } from '@logtape/logtape';

declare global {
  type Env = {
    Variables: {
      logger: Logger;
      requestId: string;
    };
  };
}
