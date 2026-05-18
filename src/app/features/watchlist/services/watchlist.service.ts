import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Security } from '../../securities/models/security.model';
import { Watchlist, WatchlistSecurity } from '../models/watchlist.model';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private readonly storageKey = 'banka1_watchlists';

  private readonly watchlistsSubject = new BehaviorSubject<Watchlist[]>(
    this.loadInitialWatchlists(),
  );

  readonly watchlists$: Observable<Watchlist[]> = this.watchlistsSubject.asObservable();

  getWatchlists(): Watchlist[] {
    return this.watchlistsSubject.value;
  }

  createWatchlist(name: string): Watchlist {
    const trimmedName = name.trim();

    const newWatchlist: Watchlist = {
      id: crypto.randomUUID(),
      name: trimmedName,
      securities: [],
    };

    const updated = [...this.getWatchlists(), newWatchlist];
    this.saveWatchlists(updated);

    return newWatchlist;
  }

  addSecurityToWatchlist(watchlistId: string, security: Security): void {
    const updated = this.getWatchlists().map(watchlist => {
      if (watchlist.id !== watchlistId) {
        return watchlist;
      }

      const alreadyExists = watchlist.securities.some(item => item.id === security.id);

      if (alreadyExists) {
        return watchlist;
      }

      return {
        ...watchlist,
        securities: [...watchlist.securities, this.mapSecurity(security)],
      };
    });

    this.saveWatchlists(updated);
  }

  removeSecurityFromWatchlist(watchlistId: string, securityId: number): void {
    const updated = this.getWatchlists().map(watchlist => {
      if (watchlist.id !== watchlistId) {
        return watchlist;
      }

      return {
        ...watchlist,
        securities: watchlist.securities.filter(item => item.id !== securityId),
      };
    });

    this.saveWatchlists(updated);
  }

  isSecurityInWatchlist(watchlistId: string, securityId: number): boolean {
    const watchlist = this.getWatchlists().find(item => item.id === watchlistId);

    return !!watchlist?.securities.some(item => item.id === securityId);
  }

  private loadInitialWatchlists(): Watchlist[] {
    const stored = localStorage.getItem(this.storageKey);

    if (stored) {
      try {
        return JSON.parse(stored) as Watchlist[];
      } catch {
        localStorage.removeItem(this.storageKey);
      }
    }

    const initialWatchlists: Watchlist[] = [
      {
        id: crypto.randomUUID(),
        name: 'Tech akcije',
        securities: [],
      },
      {
        id: crypto.randomUUID(),
        name: 'Forex parovi',
        securities: [],
      },
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(initialWatchlists));

    return initialWatchlists;
  }

  private saveWatchlists(watchlists: Watchlist[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(watchlists));
    this.watchlistsSubject.next(watchlists);
  }

  private mapSecurity(security: Security): WatchlistSecurity {
    return {
      id: security.id,
      ticker: security.ticker,
      name: security.name,
      type: security.type,
      price: security.price,
      currency: security.currency,
      change: security.change,
      changePercent: security.changePercent,
      volume: security.volume,
      exchange: security.exchange,
    };
  }
}
