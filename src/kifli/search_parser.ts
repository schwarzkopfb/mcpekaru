import { isRecord, stringValue } from '../shared/values.ts';
import type { ProductSummary } from '../types.ts';
import { productAvailability } from './availability.ts';
import { productPopupValue, productUrl } from './product_urls.ts';

export function extractProductSummariesFromSearchResponse(
  payload: unknown,
): ProductSummary[] {
  const products = isRecord(payload) ? productList(payload) : [];
  return uniqueById(
    products
      .map(productSummaryFromSearchProduct)
      .filter((product) => product.id && product.name),
  );
}

function productSummaryFromSearchProduct(
  product: Record<string, unknown>,
): ProductSummary {
  const id = stringValue(product.productId) || stringValue(product.id);
  const baseLink = stringValue(product.baseLink);
  const link = stringValue(product.link);
  return {
    ...productAvailability(product),
    id,
    name: stringValue(product.productName) || stringValue(product.name),
    url: productUrl(id, baseLink || productPopupValue(link)),
    price: priceFromSearchProduct(product.price),
  };
}

function productList(
  payload: Record<string, unknown>,
): Record<string, unknown>[] {
  const data = payload.data;
  if (!isRecord(data) || !Array.isArray(data.productList)) return [];
  return data.productList.filter(isRecord);
}

function priceFromSearchProduct(price: unknown): string | undefined {
  if (!isRecord(price)) return undefined;
  const full = stringValue(price.full);
  const currency = stringValue(price.currency);
  return [full, currency].filter(Boolean).join(' ') || undefined;
}

function uniqueById(products: ProductSummary[]): ProductSummary[] {
  return [
    ...new Map(products.map((product) => [product.id, product])).values(),
  ];
}
