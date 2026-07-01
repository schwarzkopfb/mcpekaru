import { config } from './config.ts';
import type { JsonFetcher, ProductDetails, ProductSummary } from './types.ts';

export function buildSearchApiUrl(query: string): string {
  const params = new URLSearchParams({
    query,
    offset: '0',
    limit: '24',
  });
  return absoluteKifliUrl(`/services/frontend-service/search?${params}`);
}

export function buildProductApiUrl(id: string): string {
  return absoluteKifliUrl(
    `/api/v1/products?products=${encodeURIComponent(id)}`,
  );
}

export function buildProductPricesApiUrl(id: string): string {
  return absoluteKifliUrl(
    `/api/v1/products/prices?products=${encodeURIComponent(id)}`,
  );
}

export function buildProductCategoriesApiUrl(id: string): string {
  return absoluteKifliUrl(
    `/api/v1/products/categories?products=${encodeURIComponent(id)}`,
  );
}

export function absoluteKifliUrl(value: string): string {
  return new URL(value, config.kifliOrigin).toString();
}

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

export function extractProductSummariesFromSearchResponse(
  payload: unknown,
): ProductSummary[] {
  const productList = isRecord(payload)
    ? productListFromSearchPayload(payload)
    : [];
  return uniqueById(
    productList
      .map(productSummaryFromSearchProduct)
      .filter((product) => product.id && product.name),
  );
}

export function extractProductDetailsFromApiResponses(
  productsPayload: unknown,
  pricesPayload: unknown,
  categoriesPayload: unknown,
  fallbackId: string,
): ProductDetails {
  const product = productFromProductPayload(productsPayload);
  if (!product) return { id: fallbackId, name: fallbackId, attributes: {} };
  const id = stringValue(product.id) || fallbackId;
  const price = priceFromProductPricesPayload(pricesPayload, id);
  const categories = categoriesFromProductCategoriesPayload(
    categoriesPayload,
    id,
  );
  return {
    id,
    name: stringValue(product.name) || id,
    url: productUrl(id, stringValue(product.slug)),
    price,
    description: stringValue(product.productStory) || undefined,
    brand: brandName(product.brand),
    image: imageUrl(product.images),
    attributes: productAttributes(product, categories),
  };
}

export async function searchKifli(
  query: string,
  getJson: JsonFetcher = fetchJson,
): Promise<ProductSummary[]> {
  return extractProductSummariesFromSearchResponse(
    await getJson(buildSearchApiUrl(query)),
  );
}

export async function getKifliProductDetails(
  idOrUrl: string,
  getJson: JsonFetcher = fetchJson,
): Promise<ProductDetails> {
  const id = await resolveProductId(idOrUrl, getJson);
  const [product, prices, categories] = await Promise.all([
    getJson(buildProductApiUrl(id)),
    getJson(buildProductPricesApiUrl(id)),
    getJson(buildProductCategoriesApiUrl(id)),
  ]);
  return extractProductDetailsFromApiResponses(product, prices, categories, id);
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

function productSummaryFromSearchProduct(
  product: Record<string, unknown>,
): ProductSummary {
  const id = stringValue(product.productId) || stringValue(product.id);
  const baseLink = stringValue(product.baseLink);
  const link = stringValue(product.link);
  return {
    id,
    name: stringValue(product.productName) || stringValue(product.name),
    url: productUrl(id, baseLink || productPopupValue(link)),
    price: priceFromSearchProduct(product.price),
  };
}

function productAttributes(
  product: Record<string, unknown>,
  categories: string[],
): Record<string, string> {
  return Object.fromEntries(
    [
      ['unit', stringValue(product.unit)],
      ['amount', stringValue(product.textualAmount)],
      ['country', countries(product.countries).join(', ')],
      ['categories', categories.join(' > ')],
    ].filter(([, value]) => value),
  );
}

function priceFromSearchProduct(price: unknown): string | undefined {
  if (!isRecord(price)) return undefined;
  const full = stringValue(price.full);
  const currency = stringValue(price.currency);
  return [full, currency].filter(Boolean).join(' ') || undefined;
}

function priceFromProductPricesPayload(
  payload: unknown,
  id: string,
): string | undefined {
  const prices = Array.isArray(payload) ? payload.filter(isRecord) : [];
  const match =
    prices.find((item) => stringValue(item.productId) === id) ?? prices[0];
  if (!match || !isRecord(match.price)) return undefined;
  const amount = stringValue(match.price.amount);
  const currency = stringValue(match.price.currency);
  return [amount, currency].filter(Boolean).join(' ') || undefined;
}

function productUrl(id: string, value: string): string | undefined {
  const popupValue = canonicalProductPopupValue(id, value);
  return popupValue
    ? absoluteKifliUrl(`/?productPopup=${encodeURIComponent(popupValue)}`)
    : undefined;
}

function canonicalProductPopupValue(id: string, value: string): string {
  if (!id || !value || value.startsWith(`${id}-`)) return value;
  return `${id}-${value}`;
}

function productPopupValue(link: string): string {
  if (!link) return '';
  const value = new URL(link, config.kifliOrigin).searchParams.get(
    'productPopup',
  );
  return value ?? '';
}

function productListFromSearchPayload(
  payload: Record<string, unknown>,
): Record<string, unknown>[] {
  const data = payload.data;
  if (!isRecord(data) || !Array.isArray(data.productList)) return [];
  return data.productList.filter(isRecord);
}

function productFromProductPayload(
  payload: unknown,
): Record<string, unknown> | undefined {
  return Array.isArray(payload) ? payload.filter(isRecord)[0] : undefined;
}

function categoriesFromProductCategoriesPayload(
  payload: unknown,
  id: string,
): string[] {
  const items = Array.isArray(payload) ? payload.filter(isRecord) : [];
  const match =
    items.find((item) => stringValue(item.productId) === id) ?? items[0];
  if (!match || !Array.isArray(match.categories)) return [];
  return match.categories
    .filter(isRecord)
    .sort(
      (left, right) =>
        numberValue(left.level, Number.MAX_SAFE_INTEGER) -
        numberValue(right.level, Number.MAX_SAFE_INTEGER),
    )
    .map((category) => stringValue(category.name))
    .filter(Boolean);
}

function idFromValue(value: string): string {
  return (
    /[?&]productPopup=(\d+)(?:-|&|$)/i.exec(value)?.[1] ??
    /(?:^|[/-])(\d+)(?:-|$)/.exec(value)?.[1] ??
    (/^\d+$/.test(value) ? value : '')
  );
}

function brandName(brand: unknown): string | undefined {
  return stringValue(brand) || undefined;
}

function imageUrl(image: unknown): string | undefined {
  return Array.isArray(image)
    ? stringValue(image[0]) || undefined
    : stringValue(image) || undefined;
}

function countries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((country) => stringValue(country.name))
    .filter(Boolean);
}

function uniqueById(products: ProductSummary[]): ProductSummary[] {
  return [
    ...new Map(products.map((product) => [product.id, product])).values(),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
