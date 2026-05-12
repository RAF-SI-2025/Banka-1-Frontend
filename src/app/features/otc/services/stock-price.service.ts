import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, startWith, shareReplay } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

export interface StockPriceSnapshot {
  ticker: string;
  currentPrice: number;
  openPrice: number;
  previousClose: number;
  changePercent: number;
  currency: string;
  timestamp: string;
}

/**
 * PR_13 C13.6: HTTP klijent za market-service stock price feed (PR_12 C12.1).
 *
 * Polling interval 30s — backend ima 15s cache, tako da je 2× cache prozor da
 * frontend uvek dobija sveze podatke kad cache istekne.
 */
@Injectable({ providedIn: 'root' })
export class StockPriceService {
  private readonly baseUrl = `${environment.apiUrl}/stocks/price-feed`;

  constructor(private http: HttpClient) {}

  current(ticker: string): Observable<StockPriceSnapshot> {
    return this.http.get<StockPriceSnapshot>(`${this.baseUrl}/single/${ticker}`);
  }

  currentBatch(tickers: string[]): Observable<StockPriceSnapshot[]> {
    if (tickers.length === 0) {
      return new Observable(s => { s.next([]); s.complete(); });
    }
    return this.http.get<StockPriceSnapshot[]>(
      `${this.baseUrl}/current?tickers=${tickers.join(',')}`,
    );
  }

  /**
   * Polled stream: emit-uje snapshot listu na svakih 30s. Komponenta moze da
   * subscribe-uje i odjavi se preko ngOnDestroy.
   */
  poll(tickers: string[]): Observable<StockPriceSnapshot[]> {
    return interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.currentBatch(tickers)),
      shareReplay(1),
    );
  }
}
