# 0011 - Expose Kifli Stock Availability

Date: 2026-07-15

Status: Accepted

## Context

Search and product detail results did not tell MCP callers whether a product could
currently be purchased. Kifli search responses include `inStock`,
`maxBasketAmount`, and `unavailabilityReason`. The existing product, price, and
category detail endpoints do not include those fields, but the batch-capable
`/api/v1/products/stock` endpoint does.

## Decision

Expose Kifli's current stock state on both product summaries and product details.
Return `inStock`, `maxBasketAmount`, and `unavailabilityReason` when Kifli provides
them. Read search availability from the existing search response and add the stock
endpoint to product detail lookup.

Keep availability fields optional because external response fields can be absent;
absence means unknown and must not be represented as available.

## Consequences

MCP callers can avoid recommending products whose `inStock` value is `false` and
can explain temporary unavailability. Product detail calls make one additional
parallel request. The implementation now depends on the Kifli stock response shape,
which is covered by deterministic fixtures.
