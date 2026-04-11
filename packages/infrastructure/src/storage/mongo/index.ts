import { delay } from 'es-toolkit/promise';
import {
  type ClientSession,
  type ConnectOptions,
  type InferSchemaType,
  Model,
  Mongoose
} from 'mongoose';

import { env } from '../../env';
import { getLogger, infra, type Logger } from '../../logger';

import { type ModelEnumType, models, ModelSchemaMap } from './models';

export class MongoClient {
  private _mongodb: Mongoose;
  private _mongoConnectOptions: ConnectOptions = {
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
  };
  private static _instance: MongoClient;
  private _logger: Logger = getLogger(infra.mongo);
  private _initialized = false;

  /**
   * Connect to the mongo server
   */
  public async init(retry = 3) {
    if (this._initialized) {
      this._logger.warn('Mongo already initialized');
      return;
    }

    if (retry < 1) {
      this._logger.error('Mongo connect failed after retries');
      return;
    }

    this._logger.info('Initing Mongo');

    try {
      this._mongodb.connection.removeAllListeners('error');
      this._mongodb.connection.removeAllListeners('disconnected');
      this._mongodb.set('strictQuery', 'throw');

      // Log errors but don't reconnect here to avoid duplicate reconnection
      this._mongodb.connection.on('error', (error: any) => {
        this._logger.error(`Mongo error: ${JSON.stringify(error, null, 2)}`, { error });
      });

      this._mongodb.connection.on('connected', () => {
        this._logger.info('Mongo connected');
      });
      // Handle reconnection on disconnect
      this._mongodb.connection.on('disconnected', async () => {
        this._logger.warn('Mongo disconnected');
      });

      await this._mongodb.connect(env.MONGODB_URI, this._mongoConnectOptions);
    } catch (error) {
      this._logger.error(`Mongo connect error: ${JSON.stringify(error, null, 2)}`, { error });
      await this._mongodb.disconnect();
      this._logger.warn(`Retrying Mongo connect, remaining retries: ${retry - 1}`);
      await delay(1000);
      this.init(retry - 1);
    }

    this._logger.info('Mongo initialized successfully');

    // register models

    await Promise.all(
      models.map(async (_model) => {
        const model = this._mongodb.model(_model.name, _model.schema);
        // sync index
        if (env.SYNC_INDEX && env.NODE_ENV !== 'test') {
          try {
            await model.syncIndexes({ background: true });
          } catch (error: any) {
            this._logger.error(`Create index error: ${JSON.stringify(error, null, 2)}`, { error });
          }
        }
      })
    );

    this._initialized = true;
  }

  constructor() {
    this._mongodb = new Mongoose();
  }

  static getInstance(): MongoClient {
    if (!MongoClient._instance) {
      MongoClient._instance = new MongoClient();
    }
    return MongoClient._instance;
  }

  get Mongo(): Mongoose {
    return this._mongodb;
  }

  public getModel<T extends ModelEnumType>(
    model: T
  ): Model<InferSchemaType<(typeof ModelSchemaMap)[T]['schema']>> {
    return this._mongodb.models[ModelSchemaMap[model].name] as Model<
      InferSchemaType<(typeof ModelSchemaMap)[T]['schema']>
    >;
  }

  public async sessionRun<T = unknown>(
    fn: (session: ClientSession) => Promise<T>,
    { timeout = 60000 }
  ): Promise<T> {
    const session = await this._mongodb.startSession();

    try {
      session.startTransaction({
        maxCommitTimeMS: timeout
      });
      const result = await fn(session);

      await session.commitTransaction();

      return result;
    } catch (error) {
      if (!session.inTransaction()) {
        await session.abortTransaction();
      } else {
        this._logger.warn('Uncaught mongo session error', { error });
      }
      return Promise.reject(error);
    } finally {
      await session.endSession();
    }
  }
}
