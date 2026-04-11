import type { Schema } from 'mongoose';

import { getLogger, infra } from '../../../logger/index';

export const defineModel = <T extends Schema>(name: string, schema: T) => {
  const operations = [/^find/, 'save', 'create', /^update/, /^delete/];

  operations.forEach((op: any) => {
    schema.pre(op, function (this: any, next: () => void) {
      this._startTime = Date.now();
      next();
    });

    schema.post(op, function (this: any, _result: any, next: () => void) {
      const logger = getLogger(infra.mongo);
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        if (duration > 1000) {
          logger.warn(`Slow operation ${duration}ms on ${this.collection?.name}`);
        }
      }
      next();
    });
  });

  return {
    name,
    schema
  };
};
