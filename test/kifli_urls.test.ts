import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  absoluteKifliUrl,
  buildProductApiUrl,
  buildProductCategoriesApiUrl,
  buildProductPricesApiUrl,
  buildProductStockApiUrl,
  buildSearchApiUrl,
} from '../src/kifli.ts';

test('build API URLs encode Kifli values', () => {
  assert.equal(
    buildProductStockApiUrl('97506'),
    'https://www.kifli.hu/api/v1/products/stock?products=97506',
  );
  assert.equal(
    buildSearchApiUrl('kakaos csiga'),
    'https://www.kifli.hu/services/frontend-service/search?query=kakaos+csiga&offset=0&limit=24',
  );
  assert.equal(
    buildProductApiUrl('97506'),
    'https://www.kifli.hu/api/v1/products?products=97506',
  );
  assert.equal(
    buildProductPricesApiUrl('97506'),
    'https://www.kifli.hu/api/v1/products/prices?products=97506',
  );
  assert.equal(
    buildProductCategoriesApiUrl('97506'),
    'https://www.kifli.hu/api/v1/products/categories?products=97506',
  );
  assert.equal(absoluteKifliUrl('/x'), 'https://www.kifli.hu/x');
});
