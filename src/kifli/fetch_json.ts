import { config } from '../config.ts';

export async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': `${config.serverName}/${config.serverVersion}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Kifli API request failed with ${response.status}: ${url}`);
  }
  return response.json();
}
