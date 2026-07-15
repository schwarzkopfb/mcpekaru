import { isRecord, numberValue, stringValue } from '../shared/values.ts';
import type { ProductAvailability } from '../types.ts';

export function productAvailability(value: unknown): ProductAvailability {
  if (!isRecord(value)) return {};
  const maxBasketAmount = numberValue(value.maxBasketAmount, -1);
  return {
    inStock: typeof value.inStock === 'boolean' ? value.inStock : undefined,
    maxBasketAmount: maxBasketAmount >= 0 ? maxBasketAmount : undefined,
    unavailabilityReason: stringValue(value.unavailabilityReason) || undefined,
  };
}
