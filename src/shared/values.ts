export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

export function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

export function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
