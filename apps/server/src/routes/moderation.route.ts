import { ModerationContract } from '@interface-adapter/contracts/route/moderation.contract';

import {
  makeModerationCheckUC,
  type ModerationCheckUCDeps
} from '@usecase/moderation/moderation-check.uc';
import {
  makeModerationDetailUC,
  type ModerationDetailUCDeps
} from '@usecase/moderation/moderation-detail.uc';
import { ErrorCode } from '@infrastructure/errors/error.registry';
import { createOpenAPIHono, createRoute, R } from '@infrastructure/hono/utils/response';
import { getErrText } from '@shared/utils/err';

export type ModerationRouteDeps = ModerationDetailUCDeps & ModerationCheckUCDeps;

export const makeModerationRoute = (deps: ModerationRouteDeps) => {
  const route = createOpenAPIHono();

  route.openapi(
    createRoute({
      ...ModerationContract.Get.meta,
      request: {
        query: ModerationContract.Get.request
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ModerationContract.Get.response[200]
            }
          }
        },
        404: {
          description: 'HTTP 404 response',
          content: {
            'application/json': {
              schema: ModerationContract.Get.response[404]
            }
          }
        }
      }
    }),
    async (c) => {
      const moderationDetailUC = makeModerationDetailUC(deps);
      const query = c.req.valid('query');
      const [result, err] = await moderationDetailUC(query);

      if (err) {
        return R.fail(c, 404, err.error);
      }

      return R.success(c, result);
    }
  );

  route.openapi(
    createRoute({
      ...ModerationContract.Check.meta,
      request: {
        body: {
          content: {
            'application/json': {
              schema: ModerationContract.Check.request
            }
          }
        }
      },
      responses: {
        200: {
          description: 'HTTP 200 response',
          content: {
            'application/json': {
              schema: ModerationContract.Check.response[200]
            }
          }
        },
        400: {
          description: 'HTTP 400 response',
          content: {
            'application/json': {
              schema: ModerationContract.Check.response[400]
            }
          }
        }
      }
    }),
    async (c) => {
      const body = c.req.valid('json');
      const moderationCheckUC = makeModerationCheckUC(deps);

      try {
        const [result, err] = await moderationCheckUC(body);
        if (err) {
          return R.fail(c, 400, err.error);
        }
        return R.success(c, result);
      } catch (error) {
        deps.logger.error('Moderation Check Unexpected Error', {
          code: ErrorCode.pluginInvokeFailed,
          error,
          data: {
            pluginId: body.pluginId,
            source: body.source ?? 'system',
            ...(body.version ? { version: body.version } : {})
          }
        });
        return R.fail(c, 400, getErrText(error, 'Moderation check failed'));
      }
    }
  );

  return route;
};
