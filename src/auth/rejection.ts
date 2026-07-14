import type { TokenCheck } from '../types.ts';

export async function authFailure(
  check: TokenCheck,
  token: string,
): Promise<string | undefined> {
  try {
    await check(token);
  } catch (error) {
    return error instanceof Error ? error.message : 'Token rejected';
  }
}
