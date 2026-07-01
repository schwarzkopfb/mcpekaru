import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config } from '../src/config.ts';
import {
  absoluteKifliUrl,
  buildSearchUrl,
  extractJsonLd,
  extractProductDetails,
  extractProductSummaries,
  getKifliProductDetails,
  searchKifli,
} from '../src/kifli.ts';
import type { Browser } from '../src/types.ts';

const productJson = JSON.stringify({
  '@type': 'Product',
  sku: 'SKU123',
  name: 'Kakaos csiga',
  url: '/termek/kakaos-csiga',
  description: 'Friss pekaru',
  brand: { name: 'Kifli' },
  image: ['/image.jpg'],
  offers: { price: 599 },
});

test('buildSearchUrl encodes Kifli queries', () => {
  assert.equal(
    buildSearchUrl('kakaos csiga'),
    'https://www.kifli.hu/kereses?q=kakaos%20csiga',
  );
  assert.equal(absoluteKifliUrl('/termek/x'), 'https://www.kifli.hu/termek/x');
});

test('extractJsonLd ignores invalid blocks and decodes entities', () => {
  const html = `<script type="application/ld+json">{&quot;@type&quot;:&quot;Product&quot;}</script><script type="application/ld+json">x</script>`;
  assert.deepEqual(extractJsonLd(html), [{ '@type': 'Product' }]);
});

test('extractProductSummaries reads JSON-LD products', () => {
  assert.deepEqual(
    extractProductSummaries(
      `<script type="application/ld+json">${productJson}</script>`,
    ),
    [
      {
        id: 'SKU123',
        name: 'Kakaos csiga',
        url: 'https://www.kifli.hu/termek/kakaos-csiga',
        price: '599',
      },
    ],
  );
});

test('extractProductSummaries falls back to product links', () => {
  const html = `<a href="/termek/ABC99" data-sku="ABC99"><span> Alma &amp; korte </span></a>`;
  assert.deepEqual(extractProductSummaries(html), [
    {
      id: 'ABC99',
      name: 'Alma & korte',
      url: 'https://www.kifli.hu/termek/ABC99',
    },
  ]);
});

test('extractProductDetails reads product fields and fallback attributes', () => {
  assert.deepEqual(
    extractProductDetails(
      `<script type="application/ld+json">${productJson}</script>`,
      'SKU123',
    ),
    {
      id: 'SKU123',
      name: 'Kakaos csiga',
      url: 'https://www.kifli.hu/termek/kakaos-csiga',
      price: '599',
      description: 'Friss pekaru',
      brand: 'Kifli',
      image: '/image.jpg',
      attributes: {},
    },
  );
  assert.deepEqual(
    extractProductDetails('<dt>Szarm.</dt><dd>HU</dd>', 'NOJSON'),
    {
      id: 'NOJSON',
      name: 'NOJSON',
      attributes: { 'Szarm.': 'HU' },
    },
  );
});

test('searchKifli uses the browser boundary', async () => {
  const calls: string[] = [];
  const result = await searchKifli('tej', async () =>
    fakeBrowser(
      calls,
      `<script type="application/ld+json">${productJson}</script>`,
    ),
  );
  assert.equal(calls[0], 'https://www.kifli.hu/kereses?q=tej');
  assert.equal(calls.at(-1), 'close');
  assert.equal(result[0].id, 'SKU123');
});

test('getKifliProductDetails resolves IDs through search results', async () => {
  const html = [
    '<a href="/termek/SKU123" data-sku="SKU123">Kakaos csiga</a>',
    `<script type="application/ld+json">${productJson}</script>`,
  ];
  const calls: string[] = [];
  const result = await getKifliProductDetails('SKU123', async () =>
    fakeBrowser(calls, html),
  );
  assert.deepEqual(calls.slice(0, 2), [
    'https://www.kifli.hu/kereses?q=SKU123',
    'https://www.kifli.hu/termek/SKU123',
  ]);
  assert.equal(result.name, 'Kakaos csiga');
});

test('getKifliProductDetails accepts direct URLs', async () => {
  const calls: string[] = [];
  await getKifliProductDetails('https://www.kifli.hu/termek/SKU123', async () =>
    fakeBrowser(calls, productJson),
  );
  assert.equal(calls[0], 'https://www.kifli.hu/termek/SKU123');
});

function fakeBrowser(calls: string[], html: string | string[]): Browser {
  const pages = Array.isArray(html) ? html : [html];
  return {
    async newPage() {
      return {
        async setExtraHTTPHeaders(headers) {
          calls.push(`headers:${JSON.stringify(headers)}`);
        },
        async goto(url) {
          calls.push(url);
        },
        async content() {
          const next = pages.shift() ?? '';
          return next.includes('<')
            ? next
            : `<script type="application/ld+json">${next}</script>`;
        },
      };
    },
    async close() {
      calls.push('close');
    },
  };
}
