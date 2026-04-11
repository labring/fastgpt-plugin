/**
 * Controller Description
 * Description：Confirm the uploaded plugin file.
 * Version：v1.0.0
 * Author：FinleyGe
 */

import { makePluginConfirmUC } from '@usecase/plugin/plugin-confirm.uc';

import { PluginConfirmContract } from '../../contracts/route/plugin.contract';
import { R } from '../../http/http.type';
import { buildController } from '../utils';

type Deps = {
  usecase: ReturnType<typeof makePluginConfirmUC>;
};

export const makePluginConfirmCtrl = buildController({
  contract: PluginConfirmContract,
  handler:
    ({ usecase }: Deps) =>
    async ({ body }) => {
      const [, err] = await usecase({
        uniqueId: {
          ...body.body
        }
      });

      if (err) {
        return R.fail(500, err.reason);
      }
      return R.success();
    }
});
