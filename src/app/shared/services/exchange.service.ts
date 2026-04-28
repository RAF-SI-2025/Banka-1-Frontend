import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type MarketPhase = 'CLOSED' | 'PRE_MARKET' | 'REGULAR_MARKET' | 'POST_MARKET';

export interface StockExchange {
  id: number;
  exchangeName: string;
  exchangeAcronym: string;
  exchangeMICCode: string;
  currency: string;
  timeZone: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

export interface ExchangeStatusResponse {
  id: number;
  exchangeName: string;
  exchangeAcronym: string;
  exchangeMICCode: string;
  polity: string;
  timeZone: string;
  localDate: string;
  localTime: string;
  openTime: string;
  closeTime: string;
  preMarketOpenTime: string;
  preMarketCloseTime: string;
  postMarketOpenTime: string;
  postMarketCloseTime: string;
  isActive: boolean;
  workingDay: boolean;
  holiday: boolean;
  open: boolean;
  regularMarketOpen: boolean;
  testModeBypassEnabled: boolean;
  marketPhase: MarketPhase;
}

export interface AfterHoursStatus {
  isAfterHours: boolean;
  isClosed: boolean;
  marketPhase: MarketPhase;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ExchangeService {
  private readonly baseUrl = `${environment.apiUrl}/stock/api/stock-exchanges`;
  private exchangesCache: StockExchange[] | null = null;

  constructor(private readonly http: HttpClient) {}

  getExchanges(): Observable<StockExchange[]> {
    if (this.exchangesCache) {
      return of(this.exchangesCache);
    }
    return this.http.get<StockExchange[]>(this.baseUrl).pipe(
      tap(exchanges => this.exchangesCache = exchanges)
    );
  }

  getExchangeByMicCode(micCode: string): Observable<StockExchange | undefined> {
    return this.getExchanges().pipe(
      map(exchanges => exchanges.find(e => e.exchangeMICCode === micCode))
    );
  }

  getExchangeStatus(exchangeId: number): Observable<ExchangeStatusResponse> {
    return this.http.get<ExchangeStatusResponse>(`${this.baseUrl}/${exchangeId}/is-open`);
  }

  checkAfterHours(exchangeId: number): Observable<AfterHoursStatus> {
    return this.getExchangeStatus(exchangeId).pipe(
      map(status => this.calculateAfterHoursStatus(status))
    );
  }

  checkAfterHoursByMicCode(micCode: string): Observable<AfterHoursStatus> {
    return this.getExchangeByMicCode(micCode).pipe(
      switchMap(exchange => {
        if (!exchange) {
          return of({
            isAfterHours: false,
            isClosed: false,
            marketPhase: 'REGULAR_MARKET' as MarketPhase,
            message: ''
          });
        }
        return this.checkAfterHours(exchange.id);
      })
    );
  }

  private calculateAfterHoursStatus(status: ExchangeStatusResponse): AfterHoursStatus {
    const isClosed = status.marketPhase === 'CLOSED' || !status.open;
    const isPostMarket = status.marketPhase === 'POST_MARKET';
    const isPreMarket = status.marketPhase === 'PRE_MARKET';

    // Check if within 4 hours of closing (after-hours period)
    const isNearClose = this.isWithinHoursOfClose(status, 4);

    const isAfterHours = isClosed || isPostMarket || isPreMarket || isNearClose;

    let message = '';
    if (isClosed) {
      message = 'Berza je trenutno zatvorena. Orderi postavljeni van radnog vremena izvršavaju se sporije - svaki deo čeka dodatnih 30 minuta.';
    } else if (isPostMarket) {
      message = 'Berza je u after-hours periodu. Orderi postavljeni u ovom periodu izvršavaju se sporije - svaki deo čeka dodatnih 30 minuta.';
    } else if (isPreMarket) {
      message = 'Berza je u pre-market periodu. Orderi postavljeni u ovom periodu izvršavaju se sporije - svaki deo čeka dodatnih 30 minuta.';
    } else if (isNearClose) {
      message = 'Berza se uskoro zatvara. Orderi postavljeni blizu zatvaranja mogu se izvršavati sporije.';
    }

    return {
      isAfterHours,
      isClosed,
      marketPhase: status.marketPhase,
      message
    };
  }

  private isWithinHoursOfClose(status: ExchangeStatusResponse, hours: number): boolean {
    if (!status.localTime || !status.closeTime) return false;

    try {
      const [localHours, localMinutes] = status.localTime.split(':').map(Number);
      const [closeHours, closeMinutes] = status.closeTime.split(':').map(Number);

      const localMinutesTotal = localHours * 60 + localMinutes;
      const closeMinutesTotal = closeHours * 60 + closeMinutes;

      const minutesUntilClose = closeMinutesTotal - localMinutesTotal;
      const hoursUntilClose = minutesUntilClose / 60;

      return hoursUntilClose > 0 && hoursUntilClose <= hours;
    } catch {
      return false;
    }
  }
}
