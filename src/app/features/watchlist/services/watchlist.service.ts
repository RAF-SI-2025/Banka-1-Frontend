import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Watchlist, WatchlistItem } from '../models/watchlist.model';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly baseUrl = `${environment.apiUrl}/watchlists`;
  private readonly watchlistsSubject = new BehaviorSubject<Watchlist[]>([]);

  readonly watchlists$ = this.watchlistsSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  refreshWatchlists(): void {
    this.http.get<Watchlist[]>(this.baseUrl).subscribe({
      next: (watchlists) => this.watchlistsSubject.next(watchlists),
      error: () => {},
    });
  }

  createWatchlist(name: string): Observable<Watchlist> {
    return this.http.post<Watchlist>(this.baseUrl, { name }).pipe(
      tap(() => this.refreshWatchlists()),
    );
  }

  deleteWatchlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.refreshWatchlists()),
    );
  }

  getItems(watchlistId: number): Observable<WatchlistItem[]> {
    return this.http.get<WatchlistItem[]>(`${this.baseUrl}/${watchlistId}/items`);
  }

  addItem(watchlistId: number, listingId: number): Observable<WatchlistItem> {
    return this.http.post<WatchlistItem>(`${this.baseUrl}/${watchlistId}/items`, { listingId });
  }

  removeItem(watchlistId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${watchlistId}/items/${itemId}`);
  }
}
