import { isProd } from '../constants';
import { addLog } from './log';
import { MongoClient } from 'mongodb';

// Define custom Model interface since we're not using mongoose
interface Model<_T> {
  collection: { name: string };
  syncIndexes: (options: any) => Promise<any>;
}

// Define Mongoose-like interface for compatibility
interface Mongoose {
  client: MongoClient | null;
  connection: {
    readyState: number;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: (event: string) => void;
  };
  set: (_option: string, _value: any) => void;
  connect: (url: string, options: any) => Promise<any>;
  disconnect: () => Promise<void>;
  models: Record<string, any>;
  model: <T>(name: string, schema: any) => Model<T>;
  mongo: {
    ReadPreference: {
      PRIMARY: string;
      PRIMARY_PREFERRED: string;
      SECONDARY: string;
      SECONDARY_PREFERRED: string;
      NEAREST: string;
    };
  };
}

// Define Schema interface
interface Schema {
  pre: (op: string | RegExp, callback: (next: () => void) => void) => void;
  post: (op: string | RegExp, callback: (result: any, next: () => void) => void) => void;
}

export const MONGO_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fastgpt';
export const MONGO_LOG_URL = (process.env.MONGODB_LOG_URI ??
  process.env.MONGODB_URI ??
  'mongodb://127.0.0.1:27017/fastgpt') as string;

// Global declarations
declare global {
  var mongodb: Mongoose | undefined;
  var mongodbLog: Mongoose | undefined;
}

// Create MongoDB connection wrapper with Mongoose-like API
class MongooseWrapper implements Mongoose {
  public client: MongoClient | null = null;
  public connection: any = {
    readyState: 0,
    on: (event: string, callback: (...args: any[]) => void) => {
      // Store event handlers
      if (!this._eventHandlers[event]) {
        this._eventHandlers[event] = [];
      }
      this._eventHandlers[event].push(callback);
    },
    removeAllListeners: (event: string) => {
      this._eventHandlers[event] = [];
    }
  };
  public models: Record<string, any> = {};
  public mongo: any = {
    ReadPreference: {
      PRIMARY: 'primary',
      PRIMARY_PREFERRED: 'primaryPreferred',
      SECONDARY: 'secondary',
      SECONDARY_PREFERRED: 'secondaryPreferred',
      NEAREST: 'nearest'
    }
  };

  private _eventHandlers: Record<string, ((...args: any[]) => void)[]> = {
    error: [],
    disconnected: []
  };

  set(_option: string, _value: any) {
    // Implementation for set method
  }

  async connect(url: string, options: any) {
    if (this.client) return this.client;

    try {
      // Create a new MongoDB client with supported options
      this.client = new MongoClient(url, {
        maxPoolSize: options.maxPoolSize,
        minPoolSize: options.minPoolSize,
        connectTimeoutMS: options.connectTimeoutMS,
        socketTimeoutMS: options.socketTimeoutMS,
        waitQueueTimeoutMS: options.waitQueueTimeoutMS,
        maxIdleTimeMS: options.maxIdleTimeMS,
        retryWrites: options.retryWrites,
        retryReads: options.retryReads,
        directConnection: options.directConnection
      });

      // Connect to the MongoDB server
      await this.client.connect();

      this.connection.readyState = 1; // Connected
      return this.client;
    } catch (error) {
      this.connection.readyState = 0; // Disconnected
      addLog.error('Failed to connect to MongoDB:', error);

      // Trigger error event
      this._eventHandlers.error?.forEach((handler) => handler(error));

      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.connection.readyState = 0;

      // Trigger disconnected event
      this._eventHandlers.disconnected?.forEach((handler) => handler());
    }
  }

  model<T>(name: string, schema: any): Model<T> {
    if (!this.models[name]) {
      // Create a model-like object
      this.models[name] = {
        collection: { name },
        syncIndexes: async (_options: any) => {
          try {
            if (this.client) {
              const db = this.client.db();
              await db.collection(name).createIndexes(schema.indexes || []);
            }
          } catch (error) {
            addLog.error(`Error creating indexes for ${name}:`, error);
          }
        }
      };
    }
    return this.models[name];
  }
}

export const connectionMongo = (() => {
  if (!global.mongodb) {
    global.mongodb = new MongooseWrapper();
  }
  return global.mongodb;
})();

export const connectionLogMongo = (() => {
  if (!global.mongodbLog) {
    global.mongodbLog = new MongooseWrapper();
  }
  return global.mongodbLog;
})();

const addCommonMiddleware = (schema: Schema) => {
  const operations = [
    /^find/,
    'save',
    'create',
    /^update/,
    /^delete/,
    'aggregate',
    'count',
    'countDocuments',
    'estimatedDocumentCount',
    'distinct',
    'insertMany'
  ];

  operations.forEach((op: any) => {
    schema.pre(op, function (this: any, next: () => void) {
      this._startTime = Date.now();
      this._query = this.getQuery ? this.getQuery() : null;

      next();
    });

    schema.post(op, function (this: any, result: any, next: () => void) {
      if (this._startTime) {
        const duration = Date.now() - this._startTime;
        const warnLogData = {
          collectionName: this.collection?.name,
          op: this.op,
          ...(this._query && { query: this._query }),
          ...(this._update && { update: this._update }),
          ...(this._delete && { delete: this._delete }),
          duration
        };

        if (duration > 1000) {
          addLog.warn(`Slow operation ${duration}ms`, warnLogData);
        }
      }
      next();
    });
  });

  return schema;
};

export const getMongoModel = <T>(name: string, schema: Schema) => {
  if (connectionMongo.models[name]) return connectionMongo.models[name] as Model<T>;
  if (!isProd) addLog.info(`Load model: ${name}`);
  addCommonMiddleware(schema);

  const model = connectionMongo.model<T>(name, schema);

  // Sync index
  syncMongoIndex(model);

  return model;
};

export const getMongoLogModel = <T>(name: string, schema: Schema) => {
  if (connectionLogMongo.models[name]) return connectionLogMongo.models[name] as Model<T>;
  addLog.info(`Load model: ${name}`);
  addCommonMiddleware(schema);

  const model = connectionLogMongo.model<T>(name, schema);

  // Sync index
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

export const readFromSecondary = {
  readPreference: ReadPreference.SECONDARY_PREFERRED, // primary | primaryPreferred | secondary | secondaryPreferred | nearest
  readConcern: 'local' as any // local | majority | linearizable | available
};

const _maxConnecting = Math.max(30, Number(process.env.DB_MAX_LINK || 20));

/**
 * connect MongoDB and init data
 */
export async function connectMongo(db: Mongoose, url: string): Promise<Mongoose> {
  /* Connecting, connected will return */
  if (db.connection.readyState !== 0) {
    return db;
  }

  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error(`Invalid MongoDB connection URL: ${url}`);
  }

  addLog.info(`connecting to ${isProd ? 'MongoDB' : url}`);

  // Event listeners
  db.connection.removeAllListeners('error');
  db.connection.removeAllListeners('disconnected');

  if (global.mongodb) {
    global.mongodb.set('strictQuery', 'throw');

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

    // 移除不支持的选项
    const options = {
      maxPoolSize: Math.max(30, Number(process.env.DB_MAX_LINK || 20)),
      minPoolSize: 20,
      connectTimeoutMS: 60000,
      waitQueueTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      maxIdleTimeMS: 300000,
      retryWrites: true,
      retryReads: true,
      directConnection: true,
      serverSelectionTimeoutMS: 60000,
      heartbeatFrequencyMS: 20000,
      maxStalenessSeconds: 120
    };

    return await db.connect(url, options);
  }

  return db;
}

// Helper function for delay
export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
