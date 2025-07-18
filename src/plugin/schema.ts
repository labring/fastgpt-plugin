// 插件 Schema 类型定义
export type FastGPTPluginSchema = {
  url: string;
  type: 'tool';
  _id?: string;
  toolId?: string; // Added toolId field
};
import { Db, Collection, ChangeStream } from 'mongodb';
import { connectionMongo } from '../utils/mongo';
import { addLog } from '../utils/log';

// MongoDB 连接配置
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'fastgpt';
const COLLECTION_NAME = 'fastgpt_plugins';

class MongoDBPlugin {
  private db: Db | null = null;
  private collection: Collection<FastGPTPluginSchema> | null = null;

  async connect(): Promise<void> {
    if (this.collection) return;

    addLog.info('Connecting to MongoDB plugin collection...');
    addLog.info(`DATABASE_NAME: ${DATABASE_NAME}`);
    addLog.info(`COLLECTION_NAME: ${COLLECTION_NAME}`);

    try {
      // Get the MongoClient from the connection
      const client = connectionMongo.client;
      if (!client) {
        throw new Error('MongoDB client not initialized');
      }

      this.db = client.db(DATABASE_NAME);
      this.collection = this.db.collection<FastGPTPluginSchema>(COLLECTION_NAME);

      addLog.info(`Connected to MongoDB: ${DATABASE_NAME}.${COLLECTION_NAME}`);
    } catch (error) {
      addLog.error('Failed to connect to MongoDB plugin collection', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // We don't disconnect here as the connection is managed by utils/mongo.ts
    this.db = null;
    this.collection = null;
  }

  watch(pipeline: any[], options: any): ChangeStream {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return this.collection.watch(pipeline, options);
  }

  async find(query: any): Promise<FastGPTPluginSchema[]> {
    // Use our model
    try {
      // We need to cast the result since our model implementation is simplified
      const result = (await this.collection?.find(query).toArray()) || [];
      return result;
    } catch (error) {
      addLog.error('Error finding plugins:', error);
      throw error;
    }
  }

  async findOne(query: any): Promise<FastGPTPluginSchema | null> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return await this.collection.findOne(query);
  }

  async insertOne(doc: Omit<FastGPTPluginSchema, '_id'>): Promise<any> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return await this.collection.insertOne(doc);
  }

  async updateOne(filter: any, update: any): Promise<any> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return await this.collection.updateOne(filter, update);
  }

  async deleteOne(filter: any): Promise<any> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return await this.collection.deleteOne(filter);
  }

  // New method to insert new plugin URL record
  async insertPluginUrl(toolId: string, url: string): Promise<any> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }

    const document: FastGPTPluginSchema = {
      toolId,
      url,
      type: 'tool'
    };

    addLog.info('Inserting document into MongoDB:', document);
    const result = await this.collection.insertOne(document);
    addLog.info('MongoDB insert result:', result);

    return result;
  }
}

export const MongoFastGPTPlugin = new MongoDBPlugin();
