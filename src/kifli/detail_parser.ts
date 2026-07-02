import { isRecord, numberValue, stringValue } from '../shared/values.ts';
import type { ProductDetails } from '../types.ts';
import { productUrl } from './product_urls.ts';

export function extractProductDetailsFromApiResponses(
  productsPayload: unknown,
  pricesPayload: unknown,
  categoriesPayload: unknown,
  fallbackId: string,
): ProductDetails {
  const product = firstRecord(productsPayload);
  if (!product) return { id: fallbackId, name: fallbackId, attributes: {} };
  const id = stringValue(product.id) || fallbackId;
  const categories = categoriesFromPayload(categoriesPayload, id);
  return {
    id,
    name: stringValue(product.name) || id,
    url: productUrl(id, stringValue(product.slug)),
    price: priceFromPayload(pricesPayload, id),
    description: stringValue(product.productStory) || undefined,
    brand: stringValue(product.brand) || undefined,
    image: imageUrl(product.images),
    attributes: productAttributes(product, categories),
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

function priceFromPayload(payload: unknown, id: string): string | undefined {
  const match = matchingRecord(payload, id);
  if (!match || !isRecord(match.price)) return undefined;
  const amount = stringValue(match.price.amount);
  const currency = stringValue(match.price.currency);
  return [amount, currency].filter(Boolean).join(' ') || undefined;
}

function categoriesFromPayload(payload: unknown, id: string): string[] {
  const match = matchingRecord(payload, id);
  if (!match || !Array.isArray(match.categories)) return [];
  return match.categories
    .filter(isRecord)
    .sort(byCategoryLevel)
    .map((category) => stringValue(category.name))
    .filter(Boolean);
}

function matchingRecord(
  payload: unknown,
  id: string,
): Record<string, unknown> | undefined {
  const items = Array.isArray(payload) ? payload.filter(isRecord) : [];
  return items.find((item) => stringValue(item.productId) === id) ?? items[0];
}

function firstRecord(payload: unknown): Record<string, unknown> | undefined {
  return Array.isArray(payload) ? payload.filter(isRecord)[0] : undefined;
}

function byCategoryLevel(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): number {
  return (
    numberValue(left.level, Number.MAX_SAFE_INTEGER) -
    numberValue(right.level, Number.MAX_SAFE_INTEGER)
  );
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
