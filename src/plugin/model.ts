import { getMongoModel } from '../utils/mongo';

// Define the schema interface
interface PluginSchema {
  pre: (op: string | RegExp, callback: (next: () => void) => void) => void;
  post: (op: string | RegExp, callback: (result: any, next: () => void) => void) => void;
  indexes?: any[];
}

// Define the plugin document interface
export interface PluginDocument {
  _id?: string;
  toolId: string;
  url: string;
  type: 'tool';
  createdAt?: Date;
  updatedAt?: Date;
}
// Create a schema-like object
const createPluginSchema = (): PluginSchema => {
  const schema: PluginSchema = {
    pre: (_op, _callback) => {},
    post: (_op, _callback) => {},
    indexes: [
      { key: { toolId: 1 }, unique: true },
      { key: { url: 1 }, unique: true },
      { key: { type: 1 } }
    ]
  };

  // Add timestamps middleware with explicit typing
  schema.pre('save', function (this: any, next: () => void) {
    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    this.updatedAt = now;
    next();
  });

  return schema;
};

// Create and export the model
export const PluginModel = getMongoModel<PluginDocument>('fastgpt_plugins', createPluginSchema());
