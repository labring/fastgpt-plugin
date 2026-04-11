export const isDuplicateKeyError = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    return true;
  }
  return false;
};
