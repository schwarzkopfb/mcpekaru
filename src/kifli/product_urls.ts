import { config } from '../config.ts';
import { absoluteKifliUrl } from './api_urls.ts';

export function productUrl(id: string, value: string): string | undefined {
  const popupValue = canonicalProductPopupValue(id, value);
  return popupValue
    ? absoluteKifliUrl(`/?productPopup=${encodeURIComponent(popupValue)}`)
    : undefined;
}

export function productPopupValue(link: string): string {
  if (!link) return '';
  return (
    new URL(link, config.kifliOrigin).searchParams.get('productPopup') ?? ''
  );
}

export function idFromValue(value: string): string {
  return (
    /[?&]productPopup=(\d+)(?:-|&|$)/i.exec(value)?.[1] ??
    /(?:^|[/-])(\d+)(?:-|$)/.exec(value)?.[1] ??
    (/^\d+$/.test(value) ? value : '')
  );
}

function canonicalProductPopupValue(id: string, value: string): string {
  if (!id || !value || value.startsWith(`${id}-`)) return value;
  return `${id}-${value}`;
}
