import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Watchlist, WatchlistSecurity } from '../models/watchlist.model';

const STORAGE_KEY = 'banka1_watchlists';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private readonly watchlistsSubject = new BehaviorSubject<Watchlist[]>(
    this.loadInitialWatchlists(),
  );

  readonly watchlists$ = this.watchlistsSubject.asObservable();

  get currentWatchlists(): Watchlist[] {
    return this.watchlistsSubject.value;
  }

  createWatchlist(name: string): void {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const newWatchlist: Watchlist = {
      id: crypto.randomUUID(),
      name: trimmedName,
      securities: [],
    };

    this.updateWatchlists([...this.currentWatchlists, newWatchlist]);
  }

  addSecurityToWatchlist(watchlistId: string, security: WatchlistSecurity): void {
    const updated = this.currentWatchlists.map((watchlist) => {
      if (watchlist.id !== watchlistId) {
        return watchlist;
      }

      const alreadyExists = watchlist.securities.some(
        (item) => item.id === security.id || item.ticker === security.ticker,
      );

      if (alreadyExists) {
        return watchlist;
      }

      return {
        ...watchlist,
        securities: [...watchlist.securities, security],
      };
    });

    this.updateWatchlists(updated);
  }

  removeSecurityFromWatchlist(watchlistId: string, securityId: number): void {
    const updated = this.currentWatchlists.map((watchlist) => {
      if (watchlist.id !== watchlistId) {
        return watchlist;
      }

      return {
        ...watchlist,
        securities: watchlist.securities.filter(
          (security) => security.id !== securityId,
        ),
      };
    });

    this.updateWatchlists(updated);
  }

  private loadInitialWatchlists(): Watchlist[] {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved) as Watchlist[];
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    return [];
  }

  private updateWatchlists(watchlists: Watchlist[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
    this.watchlistsSubject.next(watchlists);
  }
}
