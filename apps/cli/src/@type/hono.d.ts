import type { HttpRequestBodySnapshot } from '@infrastructure/hono/utils/request-log';
import type { Logger } from '@infrastructure/logger';

declare global {
  type Env = {
    Variables: {
      logger: Logger;
      requestId: string;
      requestBodySnapshot?: HttpRequestBodySnapshot;
    };
  };
}
