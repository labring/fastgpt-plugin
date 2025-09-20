import { isProd } from '../constants';
import { addLog } from '../utils/log';
import mongoose, { type Mongoose, type Model } from 'mongoose';

export const MONGO_URL = process.env.MONGODB_URI ?? '';

declare global {
  var mongodb: Mongoose | undefined;
}

export const connectionMongo = (() => {
  if (!global.mongodb) {
    global.mongodb = new mongoose.Mongoose();
  }
  return global.mongodb;
})();

const addCommonMiddleware = (schema: mongoose.Schema) => {
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
          addLog.warn(`Slow operation ${duration}ms on ${this.collection?.name}`);
        }
      }
      next();
    });
  });

  return schema;
};

export const getMongoModel = <T>(name: string, schema: mongoose.Schema) => {
  if (connectionMongo.models[name]) return connectionMongo.models[name] as Model<T>;
  if (!isProd) addLog.info(`Load model: ${name}`);
  addCommonMiddleware(schema);

  const model = connectionMongo.model<T>(name, schema);

  syncMongoIndex(model);

  return model;
};

const syncMongoIndex = async (model: Model<any>) => {
  if (process.env.SYNC_INDEX !== '0' && process.env.NODE_ENV !== 'test') {
    try {
      model.syncIndexes({ background: true });
    } catch (error: any) {
      addLog.error('Create index error', error);
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

  addLog.info(`connecting to ${isProd ? 'MongoDB' : url}`);

  try {
    db.connection.removeAllListeners('error');
    db.connection.removeAllListeners('disconnected');
    db.set('strictQuery', 'throw');

    db.connection.on('error', async (error: any) => {
      addLog.error('mongo error', error);
      try {
        if (db.connection.readyState !== 0) {
          await db.disconnect();
          await delay(1000);
          await connectMongo(db, url);
        }
      } catch (_error) {
        addLog.error('Error during reconnection:', _error);
      }
    });

    db.connection.on('disconnected', async () => {
      addLog.warn('mongo disconnected');
      try {
        if (db.connection.readyState !== 0) {
          await db.disconnect();
          await delay(1000);
          await connectMongo(db, url);
        }
      } catch (_error) {
        addLog.error('Error during reconnection:', _error);
      }
    });

    const options = {
      bufferCommands: true,
      maxPoolSize: Math.max(30, Number(process.env.MONGO_MAX_LINK || 20)),
      minPoolSize: 20,
      connectTimeoutMS: 60000,
      waitQueueTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      maxIdleTimeMS: 300000,
      retryWrites: true,
      retryReads: true,
      serverSelectionTimeoutMS: 60000,
      heartbeatFrequencyMS: 20000,
      maxStalenessSeconds: 120
    };

    await db.connect(url, options);
    addLog.info('mongo connected');
    return db;
  } catch (error) {
    addLog.error('Mongo connect error', error);
    await db.disconnect();
    await delay(1000);
    return connectMongo(db, url);
  }
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
