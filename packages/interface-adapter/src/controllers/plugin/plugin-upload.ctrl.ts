/**
 * Controller Description
 * Description：Upload Plugin pkg file.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import { makePluginUploadUC } from '@usecase/plugin/plugin-upload.uc';

import { PluginUploadContract } from '../../contracts/route/plugin.contract';
import { R } from '../../http/http.type';
import { buildController } from '../utils';

/** Dependencies */
type Deps = {
  usecase: ReturnType<typeof makePluginUploadUC>;
};

export const makePluginUploadCtrl = buildController({
  contract: PluginUploadContract,
  handler:
    ({ usecase: pluginUploadUC }: Deps) =>
    async ({ body }) => {
      const file = body?.body.file;
      if (!file) {
        return R.fail(400, {
          en: 'file is required',
          'zh-CN': '没有上传文件'
        });
      }

      if (!(file instanceof File)) {
        return R.fail(400, {
          en: 'file must be a File instance',
          'zh-CN': '上传的文件必须是一个 File 实例'
        });
      }

      const [result, err] = await pluginUploadUC({
        file: Readable.fromWeb(file.stream() as ReadableStream)
      });

      if (err) {
        return R.fail(400, err.reason);
      }

      return R.success(result);
    }
});
