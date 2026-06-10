import type { Logger } from '../../logger';
import type { HttpRequestBodySnapshot } from '../utils/request-log';

declare global {
  type Env = {
    Variables: {
      logger: Logger;
      requestId: string;
      requestBodySnapshot?: HttpRequestBodySnapshot;
    };
  };
}
