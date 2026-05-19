/**
 * WP-22 (Celina 3): Price Alert model.
 *
 * Mirrors the DTOs returned by the JWT-secured price-alert endpoints exposed
 * through the gateway at `/price-alerts`. The {@link AuthInterceptor} attaches
 * the token; every alert is scoped to the authenticated caller.
 */

/**
 * Trigger condition for an alert.
 *  - `ABOVE` — fire when the price rises above the threshold.
 *  - `BELOW` — fire when the price falls below the threshold.
 *  - `PCT_DROP_INTRADAY` — fire when the price drops by `threshold` percent
 *    within a single trading day.
 */
export type AlertCondition = 'ABOVE' | 'BELOW' | 'PCT_DROP_INTRADAY';

/** Delivery channel for a fired alert. */
export type AlertNotificationType = 'EMAIL' | 'PUSH' | 'IN_APP' | 'ALL';

/** One price alert owned by the caller. */
export interface PriceAlert {
  id: number;
  /** Underlying listing id (the watched security primary key). */
  listingId: number;
  /** Security symbol — convenience field for the management list. */
  ticker: string;
  /** Security display name — convenience field for the management list. */
  securityName: string;
  condition: AlertCondition;
  /** Target price, or percentage for `PCT_DROP_INTRADAY`. */
  threshold: number;
  notificationType: AlertNotificationType;
  /** Whether the alert is currently armed. */
  active: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/** Request body for `POST /price-alerts`. */
export interface CreatePriceAlertRequest {
  listingId: number;
  condition: AlertCondition;
  threshold: number;
  notificationType: AlertNotificationType;
}
