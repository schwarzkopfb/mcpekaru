import type { JsonFetcher, ProductDetails } from '../types.ts';
import {
  buildProductApiUrl,
  buildProductCategoriesApiUrl,
  buildProductPricesApiUrl,
  buildProductStockApiUrl,
} from './api_urls.ts';
import { extractProductDetailsFromApiResponses } from './detail_parser.ts';
import { fetchJson } from './fetch_json.ts';
import { idFromValue } from './product_urls.ts';
import { searchKifli } from './search.ts';

export async function getKifliProductDetails(
  idOrUrl: string,
  getJson: JsonFetcher = fetchJson,
): Promise<ProductDetails> {
  const id = await resolveProductId(idOrUrl, getJson);
  const [product, prices, categories, stock] = await Promise.all([
    getJson(buildProductApiUrl(id)),
    getJson(buildProductPricesApiUrl(id)),
    getJson(buildProductCategoriesApiUrl(id)),
    getJson(buildProductStockApiUrl(id)),
  ]);
  return extractProductDetailsFromApiResponses(
    product,
    prices,
    categories,
    stock,
    id,
  );
}

async function resolveProductId(
  idOrUrl: string,
  getJson: JsonFetcher,
): Promise<string> {
  const directId = idFromValue(idOrUrl);
  if (directId) return directId;
  const results = await searchKifli(idOrUrl, getJson);
  return results[0]?.id ?? idOrUrl;
}
