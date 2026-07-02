import { config } from '../config';

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
