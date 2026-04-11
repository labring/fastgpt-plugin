export const makeAuthTokenResolver = (system_token: string) => async (token?: string) => {
  if (system_token === token) {
    return;
  }
};
