import { productDetailsSchema, productSummarySchema } from './schemas.ts';

export const tools = [
  {
    name: 'kifli.search',
    description:
      'Search kifli.hu products and return names, URLs, and SKU/product IDs.',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: { query: { type: 'string' } },
    },
    outputSchema: {
      type: 'object',
      required: ['products'],
      properties: {
        products: {
          type: 'array',
          items: productSummarySchema,
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  {
    name: 'kifli.productDetails',
    description:
      'Fetch detailed kifli.hu product information by SKU, product ID, or URL.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string' } },
    },
    outputSchema: productDetailsSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
];
