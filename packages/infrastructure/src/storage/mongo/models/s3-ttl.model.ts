import { Schema } from 'mongoose';

import { defineModel } from './utils';

const model = defineModel(
  's3_ttls',
  new Schema({
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
  })
    .index({ expiredTime: 1 })
    .index({ bucketName: 1, minioKey: 1 })
);

// export const S3TTLSchema = z.object({
//   bucketName: z.string(),
//   minioKey: z.string(),
//   expiredTime: z.date()
// });

export default model;
