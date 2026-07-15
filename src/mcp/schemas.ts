export const productSummarySchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    url: { type: 'string' },
    price: { type: 'string' },
    inStock: { type: 'boolean' },
    maxBasketAmount: { type: 'number' },
    unavailabilityReason: { type: 'string' },
  },
  additionalProperties: false,
};

export const productDetailsSchema = {
  type: 'object',
  required: ['id', 'name', 'attributes'],
  properties: {
    ...productSummarySchema.properties,
    description: { type: 'string' },
    brand: { type: 'string' },
    image: { type: 'string' },
    attributes: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  },
  additionalProperties: false,
};
