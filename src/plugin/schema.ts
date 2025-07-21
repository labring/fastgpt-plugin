import { Db, Collection } from 'mongodb';
import { connectionMongo } from '../utils/mongo';
import { addLog } from '../utils/log';

const DATABASE_NAME = 'fastgpt';
const COLLECTION_NAME = 'fastgpt_plugins';

export type FastGPTPluginSchema = {
  url: string;
  type: 'tool';
  _id?: string;
  toolId?: string;
};

class MongoDBPlugin {
  private db: Db | null = null;
  private collection: Collection<FastGPTPluginSchema> | null = null;

  async connect(): Promise<void> {
    if (this.collection) return;

    addLog.info('Connecting to MongoDB plugin collection...');
    addLog.info(`DATABASE_NAME: ${DATABASE_NAME}`);
    addLog.info(`COLLECTION_NAME: ${COLLECTION_NAME}`);

    try {
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

  async find(query: any): Promise<FastGPTPluginSchema[]> {
    try {
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

  async deleteOne(filter: any): Promise<any> {
    if (!this.collection) {
      throw new Error('Not connected to MongoDB');
    }
    return await this.collection.deleteOne(filter);
  }

  // Insert new plugin URL record
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
