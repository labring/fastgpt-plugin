import {
  PluginConfirmContract,
  PluginInstallContract,
  PluginUploadContract
} from '@fastgpt-plugin/interface-adapter/contracts/route/plugin.contract';
import { makePluginConfirmCtrl } from '@interface-adapter/controllers/plugin/plugin-confirm.ctrl';
import { makePluginInstallCtrl } from '@interface-adapter/controllers/plugin/plugin-install.ctrl';
import { makePluginUploadCtrl } from '@interface-adapter/controllers/plugin/plugin-upload.ctrl';
import { honoRoute, registerRoute } from '@interface-adapter/http/hono.adapter';

import { makePluginConfirmUC, type PluginConfirmUCDeps } from '@usecase/plugin/plugin-confirm.uc';
import { makePluginInstallUC, type PluginInstallUCDeps } from '@usecase/plugin/plugin-install.uc';
import { makePluginUploadUC, type PluginUploadUCDeps } from '@usecase/plugin/plugin-upload.uc';

export type PluginRouteDeps = PluginInstallUCDeps & PluginUploadUCDeps & PluginConfirmUCDeps;

// PlugininstallUC
export const makePluginRoute = (deps: PluginRouteDeps) => {
  const route = honoRoute();

  // const uploadCtrl = makePluginUploadCtrl({
  //   usecase: makePluginUploadUC(deps)
  // });

  // const confirmCtrl = makePluginConfirmCtrl({
  //   usecase: makePluginConfirmUC(deps)
  // });

  // const installCtrl = makePluginInstallCtrl({
  //   usecase: makePluginInstallUC(deps)
  // });

  // registerRoute(route, PluginUploadContract, uploadCtrl);
  // registerRoute(route, PluginConfirmContract, confirmCtrl);
  // registerRoute(route, PluginInstallContract, installCtrl);

  return route;
};
