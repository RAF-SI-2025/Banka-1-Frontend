import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AddWatchlistItemRequest,
  CreateWatchlistRequest,
  Watchlist,
  WatchlistItem,
} from '../models/watchlist.model';

/**
 * WP-22 (Celina 3): Watchlist client.
 *
 * <p>Wraps the JWT-secured watchlist endpoints exposed through the gateway at
 * `/watchlists`. The {@link AuthInterceptor} attaches the `Authorization`
 * header automatically. Every watchlist is scoped to the authenticated caller
 * (clients with trading + actuary agents).
 *
 * <p>Item reads come back enriched with live market data (`price`, `change`,
 * `volume`) so the management page and the topbar quick-access widget render
 * without a second round-trip.
 */
@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly baseUrl = `${environment.apiUrl}/watchlists`;

  constructor(private readonly http: HttpClient) {}

  /** Lists every watchlist owned by the caller. */
  getWatchlists(): Observable<Watchlist[]> {
    return this.http.get<Watchlist[]>(this.baseUrl);
  }

  /** Creates a new named watchlist. */
  createWatchlist(name: string): Observable<Watchlist> {
    const body: CreateWatchlistRequest = { name };
    return this.http.post<Watchlist>(this.baseUrl, body);
  }

  /** Deletes a watchlist by id. */
  deleteWatchlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Fetches the enriched items of one watchlist.
   * @param listingType optional security-category filter, e.g. `STOCK`.
   */
  getItems(watchlistId: number, listingType?: string): Observable<WatchlistItem[]> {
    let params = new HttpParams();
    if (listingType) {
      params = params.set('listingType', listingType);
    }
    return this.http.get<WatchlistItem[]>(
      `${this.baseUrl}/${watchlistId}/items`,
      { params },
    );
  }

  /**
   * Adds a security (by listing id) to a watchlist.
   *
   * <p>The backend answers `404` if the listing does not exist and `409` if
   * the security is already on that watchlist — callers should surface those.
   */
  addItem(watchlistId: number, listingId: number): Observable<WatchlistItem> {
    const body: AddWatchlistItemRequest = { listingId };
    return this.http.post<WatchlistItem>(
      `${this.baseUrl}/${watchlistId}/items`,
      body,
    );
  }

  /** Removes a watchlist item by its row id. */
  removeItem(watchlistId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${watchlistId}/items/${itemId}`,
    );
  }
}
