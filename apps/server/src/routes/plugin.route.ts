import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import { createRoute, z } from '@hono/zod-openapi';
import { PluginContract } from '@interface-adapter/contracts/route/plugin.contract';

import type { LocalFileStoragePort } from '@domain/ports/file-storage/local-file-storage.port';
import type { PluginPKGFilePort } from '@domain/ports/plugin/plugin-pkg-file.port';
import type { PluginRepoPort } from '@domain/ports/plugin/plugin-repo.port';
import type { PluginRuntimeManagerPort } from '@domain/ports/plugin/plugin-runtime-manager.port';
import type { URLFileFetcherPort } from '@domain/ports/url-file-fetcher.port';
import { makePluginConfigGetUC } from '@usecase/plugin/plugin-config-get.uc';
import { makeResetPluginConfigUC } from '@usecase/plugin/plugin-config-reset.uc';
import { makeSetPluginConfigUC } from '@usecase/plugin/plugin-config-set.uc';
import { makePluginConfirmUC } from '@usecase/plugin/plugin-confirm.uc';
import { makePluginInstallUC } from '@usecase/plugin/plugin-install.uc';
import { makePluginListUC } from '@usecase/plugin/plugin-list.uc';
import { makePluginPruneDisabledUC } from '@usecase/plugin/plugin-prune-disabled.uc';
import { makePluginTagListUC } from '@usecase/plugin/plugin-tag-list.uc';
import { makePluginUploadUC } from '@usecase/plugin/plugin-upload.uc';
import { makePluginVersionsUC } from '@usecase/plugin/plugin-versions.uc';
import { createOpenAPIHono, R } from '@infrastructure/hono/utils/response';
import { getLogger, mod } from '@infrastructure/logger';

export type PluginRouteDeps = {
  localFileStorageRepo: LocalFileStoragePort;
  urlFileFetcher: URLFileFetcherPort;
  pluginPKGFileResolver: PluginPKGFilePort;
  pluginRepo: PluginRepoPort;
  pluginRuntimeManager: PluginRuntimeManagerPort;
};

export const makePluginRoute = (deps: PluginRouteDeps) => {
  const route = createOpenAPIHono();
  const logger = getLogger(mod.plugin);

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
      const pluginUploadUC = makePluginUploadUC({ ...deps, logger });
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
      const { uniqueIds } = c.req.valid('json');
      const [, err] = await pluginConfirmUC({ uniqueIds });

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
      const pluginInstallUC = makePluginInstallUC({ ...deps, logger });
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
      ...PluginContract.Versions.meta,
      request: {
        query: PluginContract.Versions.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: PluginContract.Versions.response[200]
            }
          }
        },
        500: {
          description: 'HTTP 500 response',
          content: {
            'application/json': {
              schema: PluginContract.Versions.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginVersionsUC = makePluginVersionsUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await pluginVersionsUC(query);

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

  route.openapi(
    createRoute({
      ...PluginContract.RuntimeConfigReset.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: PluginContract.RuntimeConfigReset.request
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
              schema: PluginContract.RuntimeConfigReset.response[500]
            }
          }
        }
      }
    }),
    async (c) => {
      const pluginConfigResetUC = makeResetPluginConfigUC(deps);
      const body = c.req.valid('json');
      const [, err] = await pluginConfigResetUC({
        pluginId: body.pluginId
      });

      if (err) {
        return R.fail(c, 500, err.reason);
      }

      return R.empty(c);
    }
  );

  return route;
};
