import { config } from './config.ts';
import type {
  Browser,
  BrowserFactory,
  BrowserPage,
  ProductDetails,
  ProductSummary,
} from './types.ts';

export function buildSearchUrl(query: string): string {
  return `${config.kifliOrigin}/kereses?q=${encodeURIComponent(query)}`;
}

export function absoluteKifliUrl(value: string): string {
  return new URL(value, config.kifliOrigin).toString();
}

export function extractJsonLd(html: string): unknown[] {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  return [...blocks].flatMap((block) => {
    try {
      const parsed = JSON.parse(decodeEntities(stripTags(block[1]).trim()));
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });
}

export function extractProductSummaries(html: string): ProductSummary[] {
  const products = collectProducts(extractJsonLd(html))
    .map(productSummaryFromJson)
    .filter((product) => product.id && product.name);
  return uniqueById(products.length > 0 ? products : extractProductLinks(html));
}

export function extractProductDetails(
  html: string,
  fallbackId: string,
): ProductDetails {
  const product = collectProducts(extractJsonLd(html))
    .map(productDetailsFromJson)
    .find((item) => item.id);
  return (
    product ?? {
      id: fallbackId,
      name: fallbackId,
      attributes: extractAttributePairs(html),
    }
  );
}

export async function createPuppeteerBrowser(): Promise<Browser> {
  /* node:coverage ignore next 2 */
  const puppeteer = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

export async function searchKifli(
  query: string,
  createBrowser: BrowserFactory = createPuppeteerBrowser,
): Promise<ProductSummary[]> {
  const browser = await createBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(buildSearchUrl(query), {
      waitUntil: 'networkidle2',
      timeout: config.browserTimeoutMs,
    });
    return extractProductSummaries(await page.content());
  } finally {
    await browser.close();
  }
}

export async function getKifliProductDetails(
  idOrUrl: string,
  createBrowser: BrowserFactory = createPuppeteerBrowser,
): Promise<ProductDetails> {
  const browser = await createBrowser();
  try {
    const page = await browser.newPage();
    const detailUrl = idOrUrl.startsWith('http')
      ? idOrUrl
      : await resolveProductUrl(page, idOrUrl);
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout: config.browserTimeoutMs,
    });
    return extractProductDetails(await page.content(), idOrUrl);
  } finally {
    await browser.close();
  }
}

async function resolveProductUrl(
  page: BrowserPage,
  id: string,
): Promise<string> {
  await page.goto(buildSearchUrl(id), {
    waitUntil: 'networkidle2',
    timeout: config.browserTimeoutMs,
  });
  const results = extractProductSummaries(await page.content());
  const match = results.find((item) => item.id === id) ?? results[0];
  return match?.url ?? absoluteKifliUrl(`/termek/${encodeURIComponent(id)}`);
}

function collectProducts(values: unknown[]): Record<string, unknown>[] {
  return values.flatMap((value) => {
    if (!isRecord(value)) return [];
    if (value['@type'] === 'Product') return [value];
    const graph = value['@graph'];
    return Array.isArray(graph) ? collectProducts(graph) : [];
  });
}

function productSummaryFromJson(
  product: Record<string, unknown>,
): ProductSummary {
  const id =
    stringValue(product.sku) ||
    stringValue(product.productID) ||
    stringValue(product.url);
  return {
    id,
    name: stringValue(product.name),
    url: stringValue(product.url)
      ? absoluteKifliUrl(stringValue(product.url))
      : undefined,
    price: priceFromOffers(product.offers),
  };
}

function productDetailsFromJson(
  product: Record<string, unknown>,
): ProductDetails {
  return {
    ...productSummaryFromJson(product),
    description: stringValue(product.description) || undefined,
    brand: brandName(product.brand),
    image: imageUrl(product.image),
    attributes: {},
  };
}

function extractProductLinks(html: string): ProductSummary[] {
  const links = html.matchAll(
    /<a[^>]+href=["']([^"']+)["'][^>]*(?:data-(?:sku|product-id)=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/a>/gi,
  );
  return [...links]
    .map((link) => ({
      id: link[2] || idFromUrl(link[1]),
      name: normalizeText(stripTags(link[3])),
      url: absoluteKifliUrl(link[1]),
    }))
    .filter((item) => item.id && item.name);
}

function extractAttributePairs(html: string): Record<string, string> {
  return Object.fromEntries(
    [
      ...html.matchAll(
        /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi,
      ),
    ]
      .map((match) => [
        normalizeText(stripTags(match[1])),
        normalizeText(stripTags(match[2])),
      ])
      .filter(([key, value]) => key && value),
  );
}

function priceFromOffers(offers: unknown): string | undefined {
  const offer = Array.isArray(offers) ? offers[0] : offers;
  return isRecord(offer) ? stringValue(offer.price) : undefined;
}

function brandName(brand: unknown): string | undefined {
  return isRecord(brand)
    ? stringValue(brand.name) || undefined
    : stringValue(brand) || undefined;
}

function imageUrl(image: unknown): string | undefined {
  return Array.isArray(image)
    ? stringValue(image[0]) || undefined
    : stringValue(image) || undefined;
}

function idFromUrl(url: string): string {
  return /(?:sku|product|termek)[/-]?([A-Za-z0-9_-]+)/i.exec(url)?.[1] ?? '';
}

function uniqueById(products: ProductSummary[]): ProductSummary[] {
  return [
    ...new Map(products.map((product) => [product.id, product])).values(),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function stringValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function decodeEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

function normalizeText(value: string): string {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}
