import z from 'zod';

import type { BaseFileStoragePort } from '../../ports/file-storage/base-file-storage.port';

import { FileMetaSchema } from './file.vo';
import type { FileObject } from './file-object.vo';
import type { MIMEType } from './MIME.vo';

const buildSpecialFileSchema = <T extends MIMEType>(contentType: T, fileName?: string) => {
  return z.object({
    ...FileMetaSchema.shape,
    contentType: z.literal(contentType),
    ...(fileName ? { fileName: z.string() } : {})
  });
};

export const PkgFileSchema = buildSpecialFileSchema('application/zip');
export type PkgFileType = z.infer<typeof PkgFileSchema>;

export const ImageFileSchema = z.object({
  ...FileMetaSchema.shape,
  contentType: z.union([
    z.literal('image/png'),
    z.literal('image/jpeg'),
    z.literal('image/svg+xml'),
    z.literal('image/webp'),
    z.literal('image/gif')
  ]),
  fileName: z.string()
});

// export const PkgFilesSchema = z.object({
//   /** 可运行的入口文件 */
//   index: buildSpecialFileSchema('application/javascript', 'index.js'),
//   /** 基础配置 */
//   manifest: buildSpecialFileSchema('application/json', 'manifest.json'),
//   /** 自动生成的配置文件 */
//   config: buildSpecialFileSchema('application/json', 'config.json'),
//   /** 静态资源，目前只允许图片类型 */
//   assets: z
//     .object({
//       ...BaseDirSchema.shape,
//       files: z.array(ImageFileSchema).optional()
//     })
//     .optional(),
//   /** 插件描述 README.md 文档 */
//   readme: buildSpecialFileSchema('text/markdown', 'README.md').optional(),
//   /** 插件 logo */
//   logo: LogoFileSchema.optional()
// });

// export type PkgFilesType = z.infer<typeof PkgFilesSchema>;

// export const PkgFileObjects = z.object({
//   index:
// })

export const PluginIndexFileSchema = buildSpecialFileSchema('application/javascript', 'index.js');
export type PluginIndexFileType = z.infer<typeof PluginIndexFileSchema>;

export const PluginManifestFileSchema = buildSpecialFileSchema('application/json', 'manifest.json');
export type PluginManifestFileType = z.infer<typeof PluginManifestFileSchema>;

export const PluginAssetsFileSchema = ImageFileSchema;
export type PluginAssetsFileType = z.infer<typeof PluginAssetsFileSchema>;

export const PluginReadmeFileSchema = buildSpecialFileSchema('text/markdown', 'README.md');
export type PluginReadmeFileType = z.infer<typeof PluginReadmeFileSchema>;

export const PluginLogoFileSchema = z.object({
  ...ImageFileSchema.shape,
  fileName: z.string().refine((name) => /^([^.]+\.|)logo\./i.test(name))
});

export type PluginLogoFileType = z.infer<typeof PluginLogoFileSchema>;

export type PkgContentFileObjects = {
  index: FileObject;
  manifest: FileObject;
  assets?: FileObject[];
  readme?: FileObject;
  logos?: FileObject[];
};
