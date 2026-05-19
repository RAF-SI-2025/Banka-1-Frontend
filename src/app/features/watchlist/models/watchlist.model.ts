/**
 * WP-22 (Celina 3): Watchlist — followed-securities model.
 *
 * Mirrors the DTOs returned by the JWT-secured watchlist endpoints exposed
 * through the gateway at `/watchlists`. The {@link AuthInterceptor} attaches
 * the token; every watchlist is scoped to the authenticated caller.
 */

/** A named watchlist owned by the caller. */
export interface Watchlist {
  id: number;
  name: string;
}

/**
 * One security inside a watchlist, enriched with live market data so the
 * management page and the topbar quick-access widget can render price /
 * daily-change / volume without a second round-trip.
 */
export interface WatchlistItem {
  /** Watchlist-item row id (used for removal). */
  id: number;
  /** Underlying listing id (the security primary key). */
  listingId: number;
  ticker: string;
  name: string;
  price: number;
  /** Daily change as a percentage (signed). */
  change: number;
  volume: number;
  /** Security category — `STOCK` / `FUTURE` / `FOREX` (free-form). */
  listingType: string;
}

/** Request body for `POST /watchlists`. */
export interface CreateWatchlistRequest {
  name: string;
}

/** Request body for `POST /watchlists/{id}/items`. */
export interface AddWatchlistItemRequest {
  listingId: number;
}
