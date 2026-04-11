/**
 * Controller Description
 * Description：Tool Run
 * Version：v1.0.0
 * Author：Author
 */
import type { ToolRunInputType } from '@domain/value-objects/tool.vo';
import { makeToolRunUC, type ToolRunUCDeps } from '@usecase/tool/tool-run.uc';

import { ToolRunInputDTOSchema } from '../../contracts/dto/tool.dto';

export type ToolRunCTRLDeps = ToolRunUCDeps;

// export const makeToolRunCtrl = {
//   contract: ToolRunContract,
//   handler:
//     ({ usecase }: Deps) =>
//     async ({ body }) => {
//       const streamHandler: SendStreamFn = (data) => {
//         return R.success(data);
//       };

//       const [, err] = await usecase({
//         uniqueId: body.body.uniqueId,
//         input: body.body.input,
//         ctx: {
//           systemVar: body.body.systemVar,
//           streamHandler
//         }
//       });

//       if (err) {
//         return R.fail(400, err.reason);
//       }
//     }
// };
//

// export const makeToolRunCtrl =
//   (deps: Deps, streamHandler: SendStreamFn) =>
//   async ({
//     body
//   }: {
//     body: z.infer<(typeof ToolRunContract.request.body)['application/json']>;
//     streamHandler: SendStreamFn;
//   }) => {
//     const [, err] = await deps.usecase({
//       ctx: {
//         streamHandler,
//         systemVar: body.systemVar
//       },
//       input: body.input,
//       uniqueId: body.uniqueId
//     });

//     if (err) {
//       return R.fail(400, err.reason);
//     }
//   };

export const makeToolRunCtrl = (deps: ToolRunCTRLDeps) => (_input: ToolRunInputType) => {
  const uc = makeToolRunUC(deps);
  const input = ToolRunInputDTOSchema.parse(_input);
  return uc(input);
};
