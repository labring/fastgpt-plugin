import { getMongoModel } from '../utils/mongo';

interface PluginSchema {
  pre: (op: string | RegExp, callback: (next: () => void) => void) => void;
  post: (op: string | RegExp, callback: (result: any, next: () => void) => void) => void;
  indexes?: any[];
}

export interface PluginDocument {
  _id?: string;
  toolId: string;
  url: string;
  type: 'tool';
}

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

  schema.pre('save', function (this: any, next: () => void) {
    next();
  });

  return schema;
};

export const PluginModel = getMongoModel<PluginDocument>('fastgpt_plugins', createPluginSchema());
