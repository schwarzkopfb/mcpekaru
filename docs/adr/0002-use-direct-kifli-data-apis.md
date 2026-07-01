# 0002 - Use Direct Kifli Data APIs

Date: 2026-07-02

Status: Accepted

## Context

Kifli search pages are rendered by a client-side Next.js application. Directly loading
`/kereses?q=...` can produce an HTML snapshot with no product cards or JSON-LD even
when the browser-side application can fetch matching products.

The frontend app exposes the same product search data through
`/services/frontend-service/search`, returning stable product IDs, names, popup links,
and prices. Product detail data is also available through JSON endpoints such as
`/api/v1/products`, `/api/v1/products/prices`, and `/api/v1/products/categories`.

Puppeteer made the implementation slower and more resource-intensive while still
depending on the page's client-side behavior. The direct APIs are faster, easier to
test deterministically, and avoid a browser runtime dependency.

## Decision

Supersede the Puppeteer extraction strategy from ADR 0001. Fetch Kifli product search
and product details directly from Kifli JSON data APIs using Node's built-in `fetch`.

Remove Puppeteer, browser/page abstractions, rendered HTML parsing, JSON-LD parsing,
and selector-based fallback extraction from the runtime path. Keep the MCP transport
and tool names unchanged.

## Consequences

Search and detail lookup no longer depend on browser startup, cookie banners, modals,
render timing, DOM selectors, or JSON-LD embedded in rendered pages. Failures from
Kifli data endpoints are surfaced instead of silently becoming empty arrays.

The extractor now depends on Kifli data API response shapes, so fixtures should cover
search fields such as `productId`, `productName`, `baseLink`, `link`, and price data,
plus detail fields from product, price, and category endpoints.
