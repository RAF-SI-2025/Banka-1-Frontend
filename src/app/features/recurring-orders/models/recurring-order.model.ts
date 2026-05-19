/**
 * WP-23 (Celina 3 — DCA): Recurring Orders model.
 *
 * Mirrors the DTOs returned by the JWT-secured recurring-order endpoints
 * exposed through the gateway at `/recurring-orders`. The {@link AuthInterceptor}
 * attaches the token; every standing order is scoped to the authenticated
 * caller (a client-with-trading or an actuary agent).
 *
 * <p>A recurring order is a DCA (dollar-cost-averaging) standing order: the
 * backend periodically places a Market Order on the caller's behalf. It can be
 * paused and resumed, or cancelled outright, at any time.
 */

/** Order side of a recurring order. */
export type RecurringDirection = 'BUY' | 'SELL';

/**
 * How the periodic Market Order sizes itself.
 *  - `BY_QUANTITY` — `value` is a fixed share/contract count.
 *  - `BY_AMOUNT` — `value` is a fixed money amount; the backend derives the
 *    quantity from the current price at run time.
 */
export type RecurringMode = 'BY_QUANTITY' | 'BY_AMOUNT';

/** How often the standing order places its Market Order. */
export type RecurringCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY';

/** One recurring (DCA) order owned by the caller. */
export interface RecurringOrder {
  id: number;
  /** Underlying listing id (the traded security primary key). */
  listingId: number;
  direction: RecurringDirection;
  mode: RecurringMode;
  /** Share count (`BY_QUANTITY`) or money amount (`BY_AMOUNT`). */
  value: number;
  /** Account id charged / credited by the periodic Market Order. */
  accountId: number;
  cadence: RecurringCadence;
  /** ISO-8601 timestamp of the next scheduled run. */
  nextRun: string;
  /** Whether the schedule is currently active (`false` => paused). */
  active: boolean;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/** Request body for `POST /recurring-orders`. */
export interface CreateRecurringOrderRequest {
  listingId: number;
  direction: RecurringDirection;
  mode: RecurringMode;
  value: number;
  accountId: number;
  cadence: RecurringCadence;
  /** ISO date (`yyyy-MM-dd`) of the first scheduled run. */
  nextRun: string;
}
