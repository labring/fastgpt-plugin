import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import { createRoute, z } from '@hono/zod-openapi';
import { PluginContract } from '@interface-adapter/contracts/route/plugin.contract';

import { makePluginConfigGetUC } from '@usecase/plugin/plugin-config-get.uc';
import { makeSetPluginConfigUC } from '@usecase/plugin/plugin-config-set.uc';
import { makePluginConfirmUC, type PluginConfirmUCDeps } from '@usecase/plugin/plugin-confirm.uc';
import { makePluginGetOneUC, type PluginGetOneDeps } from '@usecase/plugin/plugin-get.uc';
import { makePluginInstallUC, type PluginInstallUCDeps } from '@usecase/plugin/plugin-install.uc';
import { makePluginListUC } from '@usecase/plugin/plugin-list.uc';
import { makePluginPruneDisabledUC } from '@usecase/plugin/plugin-prune-disabled.uc';
import { makePluginTagListUC } from '@usecase/plugin/plugin-tag-list.uc';
import { makePluginUploadUC, type PluginUploadUCDeps } from '@usecase/plugin/plugin-upload.uc';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';

export type PluginRouteDeps =
  & PluginInstallUCDeps
  & PluginUploadUCDeps
  & PluginConfirmUCDeps
  & PluginGetOneDeps;

export const makePluginRoute = (deps: PluginRouteDeps) => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      ...PluginContract.Upload.meta,
      request: {
        body: {
          content: {
            'multipart/form-data': {
              schema: z.object({
                file: z.any()
              })
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.Upload.response[200]
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: PluginContract.Upload.response[400]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginUploadUC = makePluginUploadUC(deps);
      const formData = await c.req.formData();
      const file = formData.get('file');

      if (!file) {
        return R.fail(c, 400, {
          en: 'file is required',
          'zh-CN': '没有上传文件'
        });
      }

      if (!(file instanceof File)) {
        return R.fail(c, 400, {
          en: 'file must be a File instance',
          'zh-CN': '上传的文件必须是一个 File 实例'
        });
      }

      const [result, err] = await pluginUploadUC({
        file: Readable.fromWeb(file.stream() as ReadableStream)
      });

      if (err) {
        return c.json(err, 400);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.Confirm.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginContract.Confirm.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response'
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.Confirm.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginConfirmUC = makePluginConfirmUC(deps);
      const uniqueId = c.req.valid('json');
      const [, err] = await pluginConfirmUC({ uniqueId });

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return c.json({ ok: true }, 200);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.PruneDisabled.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.PruneDisabled.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.PruneDisabled.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginPruneDisabledUC = makePluginPruneDisabledUC(deps);
      const [result, err] = await pluginPruneDisabledUC();

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.Install.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginContract.Install.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.Install.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.Install.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginInstallUC = makePluginInstallUC(deps);
      const body = c.req.valid('json');
      const [result, err] = await pluginInstallUC({
        urls: body.urls,
        batchDownloadSize: 5
      });

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.Get.meta,
      request: {
        query: PluginContract.Get.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.Get.response[200]
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: PluginContract.Get.response[404]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginGetOneUC = makePluginGetOneUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await pluginGetOneUC({
        userPluginId: query
      });

      if (err) {
        return R.fail(c, 404, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.List.meta,
      request: {
        query: PluginContract.List.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.List.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.List.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginListUC = makePluginListUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await pluginListUC(query);

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.TagList.meta,
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.TagList.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.TagList.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginTagListUC = makePluginTagListUC(deps);
      const [result, err] = await pluginTagListUC({});

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.RuntimeConfigGet.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigGet.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigGet.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigGet.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginConfigGetUC = makePluginConfigGetUC(deps);
      const body = c.req.valid('json');
      const [result, err] = await pluginConfigGetUC({
        pluginId: body.pluginId
      });

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...PluginContract.RuntimeConfigSet.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigSet.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response'
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigSet.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginConfigSetUC = makeSetPluginConfigUC(deps);
      const body = c.req.valid('json');
      const [, err] = await pluginConfigSetUC({
        pluginId: body.pluginId,
        config: body.config
      });

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.empty(c);
    }
  );

  return route;
};
