import { config } from '../config.ts';

export async function fetchJson(
  url: string,
  get: typeof fetch = fetch,
): Promise<unknown> {
  const response = await get(url, {
    headers: {
      accept: 'application/json',
      'user-agent': `${config.serverName}/${config.serverVersion}`,
    },
    signal: AbortSignal.timeout(config.kifliTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Kifli API request failed with ${response.status}: ${url}`);
  }
  return response.json();
}
