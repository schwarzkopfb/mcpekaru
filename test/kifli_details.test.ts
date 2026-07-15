import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractProductDetailsFromApiResponses,
  getKifliProductDetails,
} from '../src/kifli.ts';
import categoriesPayload from './fixtures/kifli_categories_payload.json' with { type: 'json' };
import pricesPayload from './fixtures/kifli_prices_payload.json' with { type: 'json' };
import productPayload from './fixtures/kifli_product_payload.json' with { type: 'json' };
import searchPayload from './fixtures/kifli_search_payload.json' with { type: 'json' };
import stockPayload from './fixtures/kifli_stock_payload.json' with { type: 'json' };

test('extractProductDetailsFromApiResponses reads product, price, and category data', () => {
  assert.deepEqual(
    extractProductDetailsFromApiResponses(
      productPayload,
      pricesPayload,
      categoriesPayload,
      stockPayload,
      '97506',
    ),
    {
      id: '97506',
      name: 'Miil ESL teljes tej 3,5% zsírtartalommal',
      url: 'https://www.kifli.hu/?productPopup=97506-miil-esl-teljes-tej-3-5-zsirtartalommal',
      price: '529 HUF',
      description: 'Friss ESL tej.',
      brand: 'Miil',
      image: 'https://cdn.kifli.hu/images/grocery/products/97506.jpg',
      attributes: {
        unit: 'l',
        amount: '1 l',
        country: 'EU',
        categories:
          'Tejtermék és tojás > Tej és tej alapú ital > Friss, féltartós, ESL tej',
      },
      inStock: false,
      maxBasketAmount: 0,
      unavailabilityReason: 'Elfogyott. Várható ma.',
    },
  );
  assert.deepEqual(
    extractProductDetailsFromApiResponses([], [], [], [], 'missing'),
    {
      id: 'missing',
      name: 'missing',
      attributes: {},
    },
  );
});

test('getKifliProductDetails fetches direct detail APIs for numeric IDs', async () => {
  const calls: string[] = [];
  const result = await getKifliProductDetails('97506', fakeFetcher(calls));
  assert.deepEqual(calls, [
    'https://www.kifli.hu/api/v1/products?products=97506',
    'https://www.kifli.hu/api/v1/products/prices?products=97506',
    'https://www.kifli.hu/api/v1/products/categories?products=97506',
    'https://www.kifli.hu/api/v1/products/stock?products=97506',
  ]);
  assert.equal(result.name, 'Miil ESL teljes tej 3,5% zsírtartalommal');
});

test('getKifliProductDetails resolves productPopup URLs and search terms', async () => {
  const urlCalls: string[] = [];
  await getKifliProductDetails(
    'https://www.kifli.hu/?productPopup=97506-miil-esl-teljes-tej',
    fakeFetcher(urlCalls),
  );
  assert.equal(
    urlCalls[0],
    'https://www.kifli.hu/api/v1/products?products=97506',
  );

  const queryCalls: string[] = [];
  await getKifliProductDetails('tej', fakeFetcher(queryCalls));
  assert.deepEqual(queryCalls, [
    'https://www.kifli.hu/services/frontend-service/search?query=tej&offset=0&limit=24',
    'https://www.kifli.hu/api/v1/products?products=76368',
    'https://www.kifli.hu/api/v1/products/prices?products=76368',
    'https://www.kifli.hu/api/v1/products/categories?products=76368',
    'https://www.kifli.hu/api/v1/products/stock?products=76368',
  ]);
});

function fakeFetcher(calls: string[]) {
  return async (url: string): Promise<unknown> => {
    calls.push(url);
    if (url.includes('/services/frontend-service/search')) return searchPayload;
    if (url.includes('/api/v1/products/prices')) return pricesPayload;
    if (url.includes('/api/v1/products/categories')) return categoriesPayload;
    if (url.includes('/api/v1/products/stock')) return stockPayload;
    return productPayload;
  };
}
