export function errorInfo(error: unknown) {
  return error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: 'Unknown error' };
}
