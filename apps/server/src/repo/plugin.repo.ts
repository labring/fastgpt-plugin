// export class PluginRepo<T extends PluginType, Z extends z.ZodType<T>> {
//   private schema: Z;

//   protected constructor(schema: Z) {
//     this.schema = schema;
//   }

//   async create(plugin: T): Promise<void> {
//     await MongoSystemPlugin.create(plugin);
//   }

//   async update(uniqueId: PluginUniqueIdType, plugin: Partial<T>): Promise<void> {
//     await MongoSystemPlugin.updateOne(
//       {
//         ...uniqueId
//       },
//       {
//         ...plugin
//       }
//     );
//   }
//   async deleteByPluginId(pluginId: string): Promise<void> {
//     await MongoSystemPlugin.deleteMany({ pluginId });
//   }
//   async deleteByUniqueId(uniqueId: PluginUniqueIdType): Promise<void> {
//     await MongoSystemPlugin.deleteOne({ ...uniqueId });
//   }
//   async getById(id: string): Promise<T | undefined> {
//     const result = await MongoSystemPlugin.findById(id);
//     if (result) return this.schema.parse(result);
//   }
//   async listAll(): Promise<T[]> {
//     const results = await MongoSystemPlugin.find();
//     return results.map((result) => this.schema.parse(result));
//   }

//   async getByType(type: PluginTypeType): Promise<T[]> {
//     const results = await MongoSystemPlugin.find({ type });
//     return results.map((result) => this.schema.parse(result));
//   }
// }
