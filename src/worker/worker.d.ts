// declare global {
//   // eslint-disable-next-line no-var
//   var uploadFileResponseFn: (
//     data: Record<string, any>
//   ) => ((data: Record<string, any>) => void) | undefined;
// }

//eslint-disable-next-line no-var
declare var uploadFileResponseFn: (
  data: Record<string, any>
) => ((data: Record<string, any>) => void) | undefined;

// declare module NodeJS {
//   interface Global {
//     uploadFileResponseFn: (
//       data: Record<string, any>
//     ) => ((data: Record<string, any>) => void) | undefined;
//   }
// }

// export {};
