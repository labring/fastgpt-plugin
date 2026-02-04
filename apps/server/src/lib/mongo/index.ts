import { env } from '@/env';
import { getLogger, infra } from '../logger';

const logger = getLogger(infra.mongo);
import type { Model, Schema } from 'mongoose';
import { Mongoose } from 'mongoose';
import { isProd } from '@/constants';

export const MONGO_URL = env.MONGODB_URI;

declare global {
  var mongodb: Mongoose | undefined;
}

export const connectionMongo = (() => {
  if (!global.mongodb) {
    global.mongodb = new Mongoose();

    // 适配一下`scripts/deploy-marketplace.ts`的场景，因为这个时候MONGO_URL是undefined
    if (!MONGO_URL) {
      global.mongodb.set('bufferCommands', false);
      global.mongodb.set('autoIndex', false);
    }
  }
  return global.mongodb;
})() as typeof import('mongoose');

const addCommonMiddleware = (schema: Schema) => {
  const operations = [/^find/, 'save', 'create', /^update/, /^delete/];

  operations.forEach((op: any) => {
    schema.pre(op, function (this: any, next: () => void) {
      this._startTime = Date.now();
      next();
    });

    schema.post(op, function (this: any, result: any, next: () => void) {
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        if (duration > 1000) {
          logger.warn('Slow operation ${duration}ms on ${this.collection?.name}');
        }
      }
      next();
    });
  });

  return schema;
};

export const getMongoModel = <T extends Schema>(name: string, schema: T): Model<any> => {
  if (connectionMongo.models[name]) return connectionMongo.model(name) as Model<any>;
  if (!isProd) logger.info('Load model: ${name}');
  addCommonMiddleware(schema);

  const model = connectionMongo.model(name, schema);

  syncMongoIndex(model);

  return model;
};

const syncMongoIndex = async (model: Model<any>) => {
  if (MONGO_URL && env.SYNC_INDEX && env.NODE_ENV !== 'test') {
    try {
      model.syncIndexes({ background: true });
    } catch (error: any) {
      logger.error('Create index error', { error });
    }
  }
};

export const ReadPreference = connectionMongo.mongo.ReadPreference;

export async function connectMongo(db: Mongoose, url: string): Promise<Mongoose> {
  if (db.connection.readyState !== 0) {
    return db;
  }

  if (!url || typeof url !== 'string') {
    throw new Error(`Invalid MongoDB connection URL: ${url}`);
  }

  logger.info(`connecting to ${isProd ? 'MongoDB' : url}`);

  try {
    db.connection.removeAllListeners('error');
    db.connection.removeAllListeners('disconnected');
    db.set('strictQuery', 'throw');

    // Log errors but don't reconnect here to avoid duplicate reconnection
    db.connection.on('error', (error: any) => {
      logger.error('mongo error', error);
    });

    db.connection.on('connected', () => {
      logger.info('mongo connected');
    });
    // Handle reconnection on disconnect
    db.connection.on('disconnected', async () => {
      logger.error('mongo disconnected');
    });

    await db.connect(url, {
      bufferCommands: true,
      maxPoolSize: Math.max(30, env.MONGO_MAX_LINK),
      minPoolSize: 20,
      connectTimeoutMS: 60000,
      waitQueueTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      maxIdleTimeMS: 300000,
      retryWrites: true,
      retryReads: true,
      serverSelectionTimeoutMS: 60000,
      heartbeatFrequencyMS: 5000, // 5s 进行一次健康检查
      maxStalenessSeconds: 120
    });
    return db;
  } catch (error) {
    logger.error('Mongo connect error', { error });
    await db.disconnect();
    await delay(1000);
    return connectMongo(db, url);
  }
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
