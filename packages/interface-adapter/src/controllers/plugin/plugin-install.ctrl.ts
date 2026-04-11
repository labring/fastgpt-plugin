/**
 * Controller Description
 * Description：Install the plugins via urls
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { makePluginInstallUC } from '@usecase/plugin/plugin-install.uc';

import { PluginInstallContract } from '../../contracts/route/plugin.contract';
import { R } from '../../http/http.type';
import { buildController } from '../utils';

type Deps = {
  usecase: ReturnType<typeof makePluginInstallUC>;
};

export const makePluginInstallCtrl = buildController({
  contract: PluginInstallContract,
  handler:
    ({ usecase }: Deps) =>
    async ({ body }) => {
      const [res, err] = await usecase({ urls: body.body.urls, batchDownloadSize: 5 });
      if (err) {
        return R.fail(500, err.reason);
      } else {
        return R.success(res);
      }
    }
});
