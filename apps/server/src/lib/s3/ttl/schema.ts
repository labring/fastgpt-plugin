import { z } from 'zod';
import { Schema } from 'mongoose';
import { getMongoModel } from '../../mongo';

const collectionName = 's3_ttls';

export const S3TTLSchema = z.object({
  bucketName: z.string(),
  minioKey: z.string(),
  expiredTime: z.date()
});

export type S3TTLSchema = z.infer<typeof S3TTLSchema>;

const MongoS3TTLSchema = new Schema({
  bucketName: {
    type: String,
    required: true
  },
  minioKey: {
    type: String,
    required: true
  },
  expiredTime: {
    type: Date,
    required: true
  }
});

MongoS3TTLSchema.index({ expiredTime: 1 });
MongoS3TTLSchema.index({ bucketName: 1, minioKey: 1 });

export const MongoS3TTL = getMongoModel(collectionName, MongoS3TTLSchema);
