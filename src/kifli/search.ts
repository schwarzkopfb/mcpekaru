import type { JsonFetcher, ProductSummary } from '../types.ts';
import { buildSearchApiUrl } from './api_urls.ts';
import { fetchJson } from './fetch_json.ts';
import { extractProductSummariesFromSearchResponse } from './search_parser.ts';

export async function searchKifli(
  query: string,
  getJson: JsonFetcher = fetchJson,
): Promise<ProductSummary[]> {
  return extractProductSummariesFromSearchResponse(
    await getJson(buildSearchApiUrl(query)),
  );
}
