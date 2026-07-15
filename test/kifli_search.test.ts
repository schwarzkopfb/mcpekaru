import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractProductSummariesFromSearchResponse,
  searchKifli,
} from '../src/kifli.ts';
import searchPayload from './fixtures/kifli_search_payload.json' with { type: 'json' };

test('extractProductSummariesFromSearchResponse reads Kifli frontend search data', () => {
  assert.deepEqual(extractProductSummariesFromSearchResponse(searchPayload), [
    {
      id: '76368',
      name: 'Kinder tejszelet',
      url: 'https://www.kifli.hu/?productPopup=76368-kinder-tejszelet',
      price: '229 Ft',
      inStock: true,
      maxBasketAmount: 50,
      unavailabilityReason: undefined,
    },
    {
      id: '97506',
      name: 'Miil ESL teljes tej',
      url: 'https://www.kifli.hu/?productPopup=97506-miil-esl-teljes-tej',
      price: undefined,
      inStock: false,
      maxBasketAmount: 0,
      unavailabilityReason: 'Elfogyott. Várható ma.',
    },
  ]);
  assert.deepEqual(extractProductSummariesFromSearchResponse({}), []);
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
