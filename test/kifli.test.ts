import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  absoluteKifliUrl,
  buildProductApiUrl,
  buildProductCategoriesApiUrl,
  buildProductPricesApiUrl,
  buildSearchApiUrl,
  extractProductDetailsFromApiResponses,
  extractProductSummariesFromSearchResponse,
  getKifliProductDetails,
  searchKifli,
} from '../src/kifli.ts';

const searchPayload = {
  data: {
    productList: [
      {
        productId: 76368,
        productName: 'Kinder tejszelet',
        baseLink: '76368-kinder-tejszelet',
        price: { full: 229, currency: 'Ft' },
      },
      {
        productId: 97506,
        productName: 'Miil ESL teljes tej',
        link: '?productPopup=97506-miil-esl-teljes-tej',
      },
    ],
  },
};

const productPayload = [
  {
    id: 97506,
    name: 'Miil ESL teljes tej 3,5% zsírtartalommal',
    slug: '97506-miil-esl-teljes-tej-3-5-zsirtartalommal',
    unit: 'l',
    textualAmount: '1 l',
    brand: 'Miil',
    images: ['https://cdn.kifli.hu/images/grocery/products/97506.jpg'],
    countries: [{ name: 'EU' }],
    productStory: 'Friss ESL tej.',
  },
];

const pricesPayload = [
  {
    productId: 97506,
    price: { amount: 529, currency: 'HUF' },
  },
];

const categoriesPayload = [
  {
    productId: 97506,
    categories: [
      { name: 'Friss, féltartós, ESL tej', level: 2 },
      { name: 'Tejtermék és tojás', level: 0 },
      { name: 'Tej és tej alapú ital', level: 1 },
    ],
  },
];

test('build API URLs encode Kifli values', () => {
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

test('extractProductSummariesFromSearchResponse reads Kifli frontend search data', () => {
  assert.deepEqual(extractProductSummariesFromSearchResponse(searchPayload), [
    {
      id: '76368',
      name: 'Kinder tejszelet',
      url: 'https://www.kifli.hu/?productPopup=76368-kinder-tejszelet',
      price: '229 Ft',
    },
    {
      id: '97506',
      name: 'Miil ESL teljes tej',
      url: 'https://www.kifli.hu/?productPopup=97506-miil-esl-teljes-tej',
      price: undefined,
    },
  ]);
  assert.deepEqual(extractProductSummariesFromSearchResponse({}), []);
});

test('extractProductDetailsFromApiResponses reads product, price, and category data', () => {
  assert.deepEqual(
    extractProductDetailsFromApiResponses(
      productPayload,
      pricesPayload,
      categoriesPayload,
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
    },
  );
  assert.deepEqual(
    extractProductDetailsFromApiResponses([], [], [], 'missing'),
    {
      id: 'missing',
      name: 'missing',
      attributes: {},
    },
  );
});

test('searchKifli fetches the direct search API', async () => {
  const calls: string[] = [];
  const result = await searchKifli('tej', async (url) => {
    calls.push(url);
    return searchPayload;
  });
  assert.deepEqual(calls, [
    'https://www.kifli.hu/services/frontend-service/search?query=tej&offset=0&limit=24',
  ]);
  assert.equal(result[0].id, '76368');
});

test('getKifliProductDetails fetches direct detail APIs for numeric IDs', async () => {
  const calls: string[] = [];
  const result = await getKifliProductDetails('97506', fakeFetcher(calls));
  assert.deepEqual(calls, [
    'https://www.kifli.hu/api/v1/products?products=97506',
    'https://www.kifli.hu/api/v1/products/prices?products=97506',
    'https://www.kifli.hu/api/v1/products/categories?products=97506',
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
  ]);
});

function fakeFetcher(calls: string[]) {
  return async (url: string): Promise<unknown> => {
    calls.push(url);
    if (url.includes('/services/frontend-service/search')) return searchPayload;
    if (url.includes('/api/v1/products/prices')) return pricesPayload;
    if (url.includes('/api/v1/products/categories')) return categoriesPayload;
    return productPayload;
  };
}
