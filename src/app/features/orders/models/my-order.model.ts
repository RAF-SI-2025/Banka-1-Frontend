/**
 * WP-22 (Celina 3): "Moji orderi" — order history model.
 *
 * Mirrors the order DTO returned by `GET /orders/my-orders` (trading-service
 * routed through the gateway at `/orders`). The endpoint is JWT-scoped to the
 * authenticated caller; the {@link AuthInterceptor} attaches the token.
 */
import { OrderDirection, OrderStatus, OrderType } from './order.model';

/**
 * One row of the caller's order history.
 *
 * <p>Includes the security identity (`ticker` / `securityName`), the executed
 * quantity & per-unit price, the lifecycle `status`, the creation + last
 * modification timestamps and the paid `fee` (brokerage commission) — exactly
 * the columns the Celina 3 spec asks the "Moji orderi" page to show.
 */
export interface MyOrder {
  id: number;
  orderType: OrderType;
  /** Security category — `STOCK` / `FUTURE` / `FOREX` / `OPTION` (free-form). */
  listingType: string;
  ticker: string;
  securityName: string;
  quantity: number;
  pricePerUnit: number;
  status: OrderStatus;
  direction: OrderDirection;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-modification timestamp (used as the execution date). */
  lastModification: string;
  /** Paid brokerage commission, in the security currency. */
  fee: number;
}

/**
 * `PagedModel`-shaped envelope returned by `GET /orders/my-orders`.
 *
 * <p>Note this differs from the plain Spring Data `Page` envelope: the paging
 * metadata is nested under a `page` object rather than flattened onto the root.
 */
export interface MyOrderPage {
  content: MyOrder[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

/** Query filter for `GET /orders/my-orders`. All fields optional. */
export interface MyOrderFilter {
  status?: OrderStatus;
  direction?: OrderDirection;
  /** Security category filter, e.g. `STOCK`. */
  securityType?: string;
  /** ISO date (`yyyy-MM-dd`) lower bound on creation date. */
  from?: string;
  /** ISO date (`yyyy-MM-dd`) upper bound on creation date. */
  to?: string;
}
