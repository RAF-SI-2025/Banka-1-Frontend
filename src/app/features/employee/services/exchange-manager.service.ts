import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ExchangeService } from './exchange.service';
import { environment } from 'src/environments/environment.development';
import { HttpClient } from '@angular/common/http'; 

export interface ExchangeInfo {
  id?: number;
  exchangeName?: string;
  exchangeAcronym?: string;
  exchangeMICCode: string;
  polity?: string;
  currency?: string;
  timeZone?: string;
  isActive?: boolean;
  openTime?: string;
  closeTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeManagerService {
  
  private availableExchangesSubject = new BehaviorSubject<ExchangeInfo[]>([]);
  public availableExchanges$ = this.availableExchangesSubject.asObservable();

  private useMockDataSubject = new BehaviorSubject<boolean>(false);
  public useMockData$ = this.useMockDataSubject.asObservable();

  private loadErrorSubject = new BehaviorSubject<boolean>(false);
  public loadError$ = this.loadErrorSubject.asObservable();

  private readonly mockExchanges: ExchangeInfo[] = [
    {
      id: 1,
      exchangeName: 'New York Stock Exchange',
      exchangeAcronym: 'NYSE',
      exchangeMICCode: 'XNYS',
      polity: 'United States',
      currency: 'USD',
      timeZone: 'EST',
      isActive: false,
      openTime: '09:30',
      closeTime: '16:00'
    },
    {
      id: 2,
      exchangeName: 'NASDAQ',
      exchangeAcronym: 'NASDAQ',
      exchangeMICCode: 'XNGS',
      polity: 'United States',
      currency: 'USD',
      timeZone: 'EST',
      isActive: false,
      openTime: '09:30',
      closeTime: '16:00'
    },
    {
      id: 3,
      exchangeName: 'London Stock Exchange',
      exchangeAcronym: 'LSE',
      exchangeMICCode: 'XLON',
      polity: 'United Kingdom',
      currency: 'GBP',
      timeZone: 'GMT',
      isActive: true,
      openTime: '08:00',
      closeTime: '16:30'
    },
    {
      id: 4,
      exchangeName: 'Frankfurt Stock Exchange',
      exchangeAcronym: 'FSE',
      exchangeMICCode: 'XETRA',
      polity: 'Germany',
      currency: 'EUR',
      timeZone: 'CET',
      isActive: true,
      openTime: '08:00',
      closeTime: '22:00'
    },
    {
      id: 5,
      exchangeName: 'Japan Exchange Group',
      exchangeAcronym: 'JPX',
      exchangeMICCode: 'XTKS',
      polity: 'Japan',
      currency: 'JPY',
      timeZone: 'JST',
      isActive: false,
      openTime: '09:00',
      closeTime: '15:00'
    },
    {
      id: 6,
      exchangeName: 'Hong Kong Stock Exchange',
      exchangeAcronym: 'HKEX',
      exchangeMICCode: 'XHKG',
      polity: 'Hong Kong',
      currency: 'HKD',
      timeZone: 'HKT',
      isActive: true,
      openTime: '09:30',
      closeTime: '16:00'
    }
  ];

constructor(
  private http: HttpClient, 
  private exchangeService: ExchangeService
) {
  this.loadExchanges(); 
}

  /**
   * Učitava berze sa API-ja ili mock podataka
   */
  loadExchanges(): void {
    if (this.useMockDataSubject.value) {
      this.availableExchangesSubject.next(this.mockExchanges);
      this.loadErrorSubject.next(false);
    } else {
      this.exchangeService.getExchanges().subscribe({
        next: (exchanges) => {
          this.availableExchangesSubject.next(exchanges);
          this.loadErrorSubject.next(false);
        },
        error: () => {
          // Prikaži grešku umjesto fallback-a na mock
          this.availableExchangesSubject.next([]);
          this.loadErrorSubject.next(true);
        }
      });
    }
  }

  /**
   * Prebacuje između mock i stvarnih podataka
   */
  toggleMockData(): void {
    this.useMockDataSubject.next(!this.useMockDataSubject.value);
    this.loadExchanges();
  }

  /**
   * Postavlja korišćenje mock podataka
   */
  setUseMockData(useMock: boolean): void {
    if (this.useMockDataSubject.value !== useMock) {
      this.useMockDataSubject.next(useMock);
      this.loadExchanges();
    }
  }

  /**
   * Vraća dostupne MIC kodove berzi
   */
  getAvailableExchangeCodes(): string[] {
    return this.availableExchangesSubject.value.map(ex => ex.exchangeMICCode);
  }

  /**
   * Proverava da li je berza dostupna
   */
  isExchangeAvailable(exchangeMICCode: string | undefined | null): boolean {
    if (!exchangeMICCode) {
      return false;
    }
    return this.getAvailableExchangeCodes().includes(exchangeMICCode);
  }

  /**
   * Vraća informacije o berzi po MIC kodu
   */
  getExchangeInfo(exchangeMICCode: string): ExchangeInfo | undefined {
    return this.availableExchangesSubject.value.find(ex => ex.exchangeMICCode === exchangeMICCode);
  }

  /**
   * Vraća trenutne berze kao Observable
   */
  getExchanges(): Observable<ExchangeInfo[]> {
    return this.availableExchanges$;
  }

  toggleExchangeActive(id: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/stock/api/stock-exchanges/${id}/toggle-active`, {});
  }
  /**
   * Vraća trenutni status mock podataka
   */
  get isMockEnabled(): boolean {
    return this.useMockDataSubject.value;
  }
}