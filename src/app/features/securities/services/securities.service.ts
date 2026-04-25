import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Security,
  Stock,
  Future,
  Forex,
  SecuritiesFilters,
  SecuritiesPage,
  PriceHistory,
  PricePoint,
  OptionChain,
  StockOption,
  SortConfig,
} from '../models/security.model';
import { ExchangeManagerService } from '../../employee/services/exchange-manager.service';

@Injectable({ providedIn: 'root' })
export class SecuritiesService {
  private readonly stocksUrl = `${environment.apiUrl}/stock/api/listings/stocks`;
  private readonly refreshAllUrl = `${environment.apiUrl}/stock/admin/stocks/refresh-all`;

  constructor(
    private readonly http: HttpClient,
    private readonly exchangeManager: ExchangeManagerService
  ) {}

  // ===== MOCK DATA =====
  private readonly mockStocks: any[] = [
    { listingId: 1, ticker: 'AAPL', name: 'Apple Inc.', exchangeMICCode: 'XNYS', price: 174.50, change: 2.50, volume: 50000000, initialMarginCost: 15000 },
    { listingId: 2, ticker: 'MSFT', name: 'Microsoft Corporation', exchangeMICCode: 'XNGS', price: 380.50, change: -1.20, volume: 25000000, initialMarginCost: 30000 },
    { listingId: 3, ticker: 'GOOGL', name: 'Alphabet Inc.', exchangeMICCode: 'XNGS', price: 140.30, change: 3.10, volume: 18000000, initialMarginCost: 11000 },
    { listingId: 4, ticker: 'AMZN', name: 'Amazon.com Inc.', exchangeMICCode: 'XNGS', price: 170.85, change: 1.50, volume: 35000000, initialMarginCost: 13000 },
    { listingId: 5, ticker: 'NVDA', name: 'NVIDIA Corporation', exchangeMICCode: 'XNGS', price: 875.20, change: 5.40, volume: 40000000, initialMarginCost: 70000 },
    { listingId: 6, ticker: 'VOD.L', name: 'Vodafone Group', exchangeMICCode: 'XLON', price: 68.45, change: -0.50, volume: 15000000, initialMarginCost: 5000 },
  ];

  private readonly mockFutures: any[] = [
    { listingId: 101, ticker: 'ESZ23', name: 'E-mini S&P 500', exchangeMICCode: 'XCME', price: 4500.25, change: 125.50, volume: 2000000, initialMarginCost: 10000, settlementDate: '2024-12-20' },
    { listingId: 102, ticker: 'NQZ23', name: 'E-mini Nasdaq', exchangeMICCode: 'XCME', price: 14500.75, change: 300.25, volume: 1500000, initialMarginCost: 15000, settlementDate: '2024-12-20' },
    { listingId: 103, ticker: 'CLZ23', name: 'Crude Oil', exchangeMICCode: 'XCME', price: 85.50, change: 1.25, volume: 3000000, initialMarginCost: 5000, settlementDate: '2024-12-20' },
    { listingId: 104, ticker: 'GCZ23', name: 'Gold', exchangeMICCode: 'XCME', price: 2050.50, change: 25.00, volume: 500000, initialMarginCost: 8000, settlementDate: '2024-12-20' },
  ];

  private readonly mockForex: any[] = [
    { listingId: 201, ticker: 'EUR/USD', name: 'Euro vs US Dollar', exchangeMICCode: 'FXEM', price: 1.0850, change: 0.0050, volume: 5000000, initialMarginCost: 1000 },
    { listingId: 202, ticker: 'GBP/USD', name: 'British Pound vs US Dollar', exchangeMICCode: 'FXEM', price: 1.2650, change: -0.0025, volume: 3000000, initialMarginCost: 1000 },
    { listingId: 203, ticker: 'USD/JPY', name: 'US Dollar vs Japanese Yen', exchangeMICCode: 'FXEM', price: 149.50, change: 0.75, volume: 4000000, initialMarginCost: 1000 },
    { listingId: 204, ticker: 'AUD/USD', name: 'Australian Dollar vs US Dollar', exchangeMICCode: 'FXEM', price: 0.6850, change: -0.0010, volume: 2000000, initialMarginCost: 1000 },
  ];

  // ===== MOCK DATA METHODS =====
  private getMockStocksPage(filters: SecuritiesFilters = {}, page = 0, size = 10, sort?: SortConfig): SecuritiesPage<Stock> {
    let stocks = this.mockStocks.map(item => ({
      id: item.listingId,
      ticker: item.ticker,
      name: item.name,
      exchange: item.exchangeMICCode,
      price: item.price,
      currency: 'USD',
      change: item.change,
      changePercent: item.price > 0 ? (item.change / item.price) * 100 : 0,
      volume: item.volume,
      maintenanceMargin: 0,
      initialMarginCost: item.initialMarginCost,
      type: 'STOCK' as const,
      lastUpdated: new Date().toISOString(),
      high: item.price * 1.02,
      low: item.price * 0.98,
      open: item.price - item.change,
      previousClose: item.price - item.change,
      bid: item.price - 0.01,
      ask: item.price + 0.01,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      stocks = stocks.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
      );
    }

    if (sort) {
      stocks = this.sortArray(stocks, sort);
    }

    return {
      content: stocks.slice(page * size, (page + 1) * size),
      totalElements: stocks.length,
      totalPages: Math.ceil(stocks.length / size),
      number: page,
      size: size,
    };
  }

  private getMockFuturesPage(filters: SecuritiesFilters = {}, page = 0, size = 10, sort?: SortConfig): SecuritiesPage<Future> {
    let futures = this.mockFutures.map(item => ({
      id: item.listingId,
      ticker: item.ticker,
      name: item.name,
      exchange: item.exchangeMICCode,
      price: item.price,
      currency: 'USD',
      change: item.change,
      changePercent: item.price > 0 ? (item.change / item.price) * 100 : 0,
      volume: item.volume,
      maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
      initialMarginCost: item.initialMarginCost,
      type: 'FUTURE' as const,
      lastUpdated: new Date().toISOString(),
      settlementDate: item.settlementDate,
      contractSize: 1,
      openInterest: 0,
      high: item.price * 1.02,
      low: item.price * 0.98,
      open: item.price,
      previousClose: item.price - item.change,
      bid: item.price - 0.01,
      ask: item.price + 0.01,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      futures = futures.filter(f =>
        f.ticker.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q)
      );
    }

    if (sort) {
      futures = this.sortArray(futures, sort);
    }

    return {
      content: futures.slice(page * size, (page + 1) * size),
      totalElements: futures.length,
      totalPages: Math.ceil(futures.length / size),
      number: page,
      size: size,
    };
  }

  private getMockForexPage(filters: SecuritiesFilters = {}, page = 0, size = 10, sort?: SortConfig): SecuritiesPage<Forex> {
    let forexes = this.mockForex.map(item => ({
      id: item.listingId,
      ticker: item.ticker,
      name: item.name,
      exchange: item.exchangeMICCode,
      price: item.price,
      currency: 'USD',
      change: item.change,
      changePercent: item.price > 0 ? (item.change / item.price) * 100 : 0,
      volume: item.volume,
      maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
      initialMarginCost: item.initialMarginCost,
      type: 'FOREX' as const,
      lastUpdated: new Date().toISOString(),
      baseCurrency: item.ticker.split('/')[0],
      quoteCurrency: item.ticker.split('/')[1],
      bid: item.price - 0.0001,
      ask: item.price + 0.0001,
      spread: 0.0002,
      high: item.price * 1.01,
      low: item.price * 0.99,
      open: item.price,
      previousClose: item.price - item.change,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      forexes = forexes.filter(f =>
        f.ticker.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q)
      );
    }

    if (sort) {
      forexes = this.sortArray(forexes, sort);
    }

    return {
      content: forexes.slice(page * size, (page + 1) * size),
      totalElements: forexes.length,
      totalPages: Math.ceil(forexes.length / size),
      number: page,
      size: size,
    };
  }

  refreshAllStocks(): Observable<any> {
    return this.http.post(`${this.refreshAllUrl}`, {});
  }

  private mapStockItem(item: any): Stock {
    return {
      id: item.listingId,
      ticker: item.ticker ?? '',
      name: item.name ?? '',
      exchange: item.exchangeMICCode ?? '',
      price: item.price ?? 0,
      currency: 'USD',
      change: item.change ?? 0,
      changePercent: item.price > 0 ? ((item.change ?? 0) / item.price) * 100 : 0,
      volume: item.volume ?? 0,
      maintenanceMargin: 0,
      initialMarginCost: item.initialMarginCost ?? 0,
      type: 'STOCK' as const,
      lastUpdated: new Date().toISOString(),
      high: item.price ?? 0,
      low: item.price ?? 0,
      open: item.price ?? 0,
      previousClose: item.price ?? 0,
      bid: item.price ?? 0,
      ask: item.price ?? 0,
    };
  }

  private mapStocksPage(response: any, filters: SecuritiesFilters, page: number, size: number, sort?: SortConfig): SecuritiesPage<Stock> {
    let mapped: Stock[] = (response.content || []).map((item: any) => this.mapStockItem(item));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      mapped = mapped.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
      );
    }

    if (sort) {
      mapped = this.sortArray(mapped, sort);
    }

    return {
      content: mapped,
      totalElements: response.totalElements ?? mapped.length,
      totalPages: response.totalPages ?? Math.ceil(mapped.length / size),
      number: response.number ?? page,
      size: response.size ?? size,
    } as SecuritiesPage<Stock>;
  }

  private buildStockParams(filters: SecuritiesFilters, page: number, size: number): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.exchange)                params = params.set('exchange', filters.exchange);
    if (filters.priceMin !== undefined)  params = params.set('minPrice', filters.priceMin.toString());
    if (filters.priceMax !== undefined)  params = params.set('maxPrice', filters.priceMax.toString());
    if (filters.volumeMin !== undefined) params = params.set('minVolume', filters.volumeMin.toString());
    if (filters.volumeMax !== undefined) params = params.set('maxVolume', filters.volumeMax.toString());
    if (filters.marginMin !== undefined) params = params.set('minMargin', filters.marginMin.toString());
    if (filters.marginMax !== undefined) params = params.set('maxMargin', filters.marginMax.toString());
    if (filters.bidMin !== undefined)    params = params.set('minBid', filters.bidMin.toString());
    if (filters.bidMax !== undefined)    params = params.set('maxBid', filters.bidMax.toString());
    if (filters.askMin !== undefined)    params = params.set('minAsk', filters.askMin.toString());
    if (filters.askMax !== undefined)    params = params.set('maxAsk', filters.askMax.toString());

    return params;
  }

  getStocks(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Stock>> {
    // Check if mock data should be used
    if (this.exchangeManager['useMockDataSubject']?.value) {
      return of(this.getMockStocksPage(filters, page, size, sort)).pipe(delay(300));
    }

    const params = this.buildStockParams(filters, page, size);
    return this.http.get<any>(`${this.stocksUrl}`, { params }).pipe(
      map(response => this.mapStocksPage(response, filters, page, size, sort))
    );
  }

  getClientStocks(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Stock>> {
    // Check if mock data should be used
    if (this.exchangeManager['useMockDataSubject']?.value) {
      return of(this.getMockStocksPage(filters, page, size, sort)).pipe(delay(300));
    }

    const params = this.buildStockParams(filters, page, size);
    return this.http.get<any>(`${this.stocksUrl}`, { params }).pipe(
      map(response => this.mapStocksPage(response, filters, page, size, sort))
    );
  }

  /**
   * Helper method to sort array of stocks
   */
  private sortArray<T extends Security>(items: T[], sort: SortConfig): T[] {
    return [...items].sort((a, b) => {
      const field = sort.field as keyof Security;
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }


  /**
   * Get list of futures with filters and pagination
   */
  getFutures(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Future>> {
    // Check if mock data should be used
    if (this.exchangeManager['useMockDataSubject']?.value) {
      return of(this.getMockFuturesPage(filters, page, size, sort)).pipe(delay(300));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sort?.field || 'ticker')
      .set('sortDirection', sort?.direction || 'asc');

    // Apply search filter if provided
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Apply date filters
    if (filters.settlementDateFrom) {
      params = params.set('settlementDateFrom', filters.settlementDateFrom);
    }
    if (filters.settlementDateTo) {
      params = params.set('settlementDateTo', filters.settlementDateTo);
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      params = params.set('priceMin', filters.priceMin.toString());
    }
    if (filters.priceMax !== undefined) {
      params = params.set('priceMax', filters.priceMax.toString());
    }

    // Apply margin filters
    if (filters.marginMin !== undefined) {
      params = params.set('marginMin', filters.marginMin.toString());
    }
    if (filters.marginMax !== undefined) {
      params = params.set('marginMax', filters.marginMax.toString());
    }

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/futures`, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map((item: any) => {
          // Handle zero/null prices
          const price = item.price || 1.0;
          const change = item.change || 0;
          const changePercent = price > 0 ? (change / price) * 100 : 0;
          
          return {
            id: item.listingId,
            ticker: item.ticker,
            name: item.name,
            exchange: item.exchangeMICCode,
            price: price,
            currency: 'USD',
            change: change,
            changePercent: changePercent,
            volume: item.volume || 0,
            maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
            initialMarginCost: item.initialMarginCost || 0,
            type: 'FUTURE' as const,
            lastUpdated: new Date().toISOString(),
            settlementDate: item.settlementDate,
            contractSize: 1,
            openInterest: 0,
            high: price * 1.02,
            low: price * 0.98,
            open: price,
            previousClose: price - change,
            bid: price > 0 ? price - 0.01 : 0.99,
            ask: price > 0 ? price + 0.01 : 1.01,
          } as Future;
        })
      }))
    );
  }

  /**
   * Get list of forex pairs with filters and pagination
   */
  getForex(
    filters: SecuritiesFilters = {},
    page = 0,
    size = 10,
    sort?: SortConfig
  ): Observable<SecuritiesPage<Forex>> {
    // Check if mock data should be used
    if (this.exchangeManager['useMockDataSubject']?.value) {
      return of(this.getMockForexPage(filters, page, size, sort)).pipe(delay(300));
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sort?.field || 'ticker')
      .set('sortDirection', sort?.direction || 'asc');

    // Apply search filter if provided
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    // Apply price filters
    if (filters.priceMin !== undefined) {
      params = params.set('priceMin', filters.priceMin.toString());
    }
    if (filters.priceMax !== undefined) {
      params = params.set('priceMax', filters.priceMax.toString());
    }

    // Apply bid/ask filters
    if (filters.bidMin !== undefined) {
      params = params.set('bidMin', filters.bidMin.toString());
    }
    if (filters.bidMax !== undefined) {
      params = params.set('bidMax', filters.bidMax.toString());
    }
    if (filters.askMin !== undefined) {
      params = params.set('askMin', filters.askMin.toString());
    }
    if (filters.askMax !== undefined) {
      params = params.set('askMax', filters.askMax.toString());
    }

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/forex`, { params }).pipe(
      map(response => ({
        ...response,
        content: response.content.map((item: any) => {
          // Handle zero/null prices
          const price = item.price || 1.0;
          const change = item.change || 0;
          const changePercent = price > 0 ? (change / price) * 100 : 0;
          
          return {
            id: item.listingId,
            ticker: item.ticker,
            name: item.name,
            exchange: item.exchangeMICCode,
            price: price,
            currency: 'USD',
            change: change,
            changePercent: changePercent,
            volume: item.volume || 0,
            maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
            initialMarginCost: item.initialMarginCost || 0,
            type: 'FOREX' as const,
            lastUpdated: new Date().toISOString(),
            baseCurrency: item.ticker.split('/')[0] || 'USD',
            quoteCurrency: item.ticker.split('/')[1] || 'USD',
            bid: price > 0 ? price - 0.0001 : 0.9999,
            ask: price > 0 ? price + 0.0001 : 1.0001,
            spread: 0.0002,
            high: price * 1.01,
            low: price * 0.99,
            open: price,
            previousClose: price - change,
          } as Forex;
        })
      }))
    );
  }

  getStockById(id: number, period: string = 'DAY'): Observable<Stock> {
    const params = new HttpParams().set('period', period.toUpperCase());
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => ({
        id: item.listingId,
        ticker: item.ticker ?? '',
        name: item.name ?? '',
        exchange: item.exchangeMICCode ?? '',
        price: item.price ?? 0,
        currency: 'USD',
        change: item.change ?? 0,
        changePercent: item.changePercent ?? 0,
        volume: item.volume ?? 0,
        maintenanceMargin: 0,
        initialMarginCost: item.initialMarginCost ?? 0,
        type: 'STOCK' as const,
        lastUpdated: item.lastRefresh ?? new Date().toISOString(),
        high: item.price ?? 0,
        low: item.price ?? 0,
        open: item.price ?? 0,
        previousClose: item.price ?? 0,
        bid: item.bid ?? 0,
        ask: item.ask ?? 0,
        dividendYield: item.stockDetails?.dividendYield ?? undefined,
        dollarVolume: item.dollarVolume ?? undefined,
        outstandingShares: item.stockDetails?.outstandingShares ?? undefined,
        contractSize: item.stockDetails?.contractSize ?? undefined,
        priceHistory: (item.priceHistory ?? []).map((p: any) => ({
          date: p.date,
          price: p.price,
          volume: p.volume,
          change: p.change,
          changePercent: p.changePercent,
          dollarVolume: p.dollarVolume,
        })),
      } as Stock))
    );
  }

  /**
   * Get future by id (listingId)
   */
  getFutureById(id: number): Observable<Future> {
    const params = new HttpParams().set('period', 'MONTH');
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => {
        // Handle zero/null prices
        const price = item.price || 1.0;
        const change = item.change || 0;
        const changePercent = price > 0 ? (change / price) * 100 : 0;
        
        return {
          id: item.listingId,
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchangeMICCode,
          price: price,
          currency: 'USD',
          change: change,
          changePercent: changePercent,
          volume: item.volume || 0,
          maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
          initialMarginCost: item.initialMarginCost || 0,
          type: 'FUTURE' as const,
          lastUpdated: new Date().toISOString(),
          settlementDate: item.settlementDate,
          contractSize: 1,
          openInterest: 0,
          high: price * 1.02,
          low: price * 0.98,
          open: price,
          previousClose: price - change,
          bid: price > 0 ? price - 0.01 : 0.99,
          ask: price > 0 ? price + 0.01 : 1.01,
        } as Future;
      })
    );
  }

  /**
   * Get forex by id (listingId)
   */
  getForexById(id: number): Observable<Forex> {
    const params = new HttpParams().set('period', 'MONTH');
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${id}`, { params }).pipe(
      map((item: any) => {
        // Handle zero/null prices
        const price = item.price || 1.0;
        const change = item.change || 0;
        const changePercent = price > 0 ? (change / price) * 100 : 0;
        
        return {
          id: item.listingId,
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchangeMICCode,
          price: price,
          currency: 'USD',
          change: change,
          changePercent: changePercent,
          volume: item.volume || 0,
          maintenanceMargin: (item.initialMarginCost || 0) * 0.8,
          initialMarginCost: item.initialMarginCost || 0,
          type: 'FOREX' as const,
          lastUpdated: new Date().toISOString(),
          baseCurrency: item.ticker.split('/')[0],
          quoteCurrency: item.ticker.split('/')[1],
          bid: price > 0 ? price - 0.0001 : 0.9999,
          ask: price > 0 ? price + 0.0001 : 1.0001,
          spread: 0.0002,
          high: price * 1.01,
          low: price * 0.99,
          open: price,
          previousClose: price - change,
        } as Forex;
      })
    );
  }

  /**
   * Get price history for a security
   */
  getPriceHistory(ticker: string, period: string): Observable<PriceHistory> {
    // Map period from component format to API format
    const periodMap: Record<string, string> = {
      'day': 'DAY',
      'week': 'WEEK',
      'month': 'MONTH',
      'year': 'YEAR',
      '5year': 'FIVE_YEARS',
      'all': 'ALL'
    };

    const apiPeriod = periodMap[period] || 'MONTH';

    // Extract listing id from ticker (ticker contains the id in this context)
    const listingId = ticker;

    const params = new HttpParams().set('period', apiPeriod);

    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${listingId}`, { params }).pipe(
      map((response: any) => {
        // Map the response to PriceHistory format
        const priceData = response.priceHistory ? response.priceHistory.map((point: any) => ({
          date: point.date,
          price: point.price,
          volume: point.volume || 0
        })) : [];
        return {
          ticker: response.ticker || ticker,
          period: period,
          data: priceData
        } as PriceHistory;
      })
    );
  }

  /**
   * Get option chain for a stock from backend optionGroups
   * Note: ticker parameter is expected to be the stock id
   */
  getOptionChain(ticker: string, settlementDate: string): Observable<OptionChain> {
    const params = new HttpParams().set('period', 'DAY');
    
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${ticker}`, { params }).pipe(
      map((response: any) => {
        // Extract optionGroups and find matching settlement date
        const optionGroups = response.optionGroups || [];
        const matching = optionGroups.find((og: any) => og.settlementDate === settlementDate);

        if (!matching) {
          return {
            settlementDate,
            daysToExpiry: 0,
            calls: [],
            puts: [],
            strikes: []
          } as OptionChain;
        }

        const expiry = new Date(settlementDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const mapOption = (opt: any, type: 'CALL' | 'PUT'): StockOption => ({
          strike: opt.strikePrice ?? opt.strike ?? 0,
          type,
          last: opt.last ?? 0,
          theta: opt.theta ?? 0,
          bid: opt.bid ?? 0,
          ask: opt.ask ?? 0,
          volume: opt.volume ?? 0,
          openInterest: opt.openInterest ?? 0,
          inTheMoney: opt.inTheMoney ?? false,
        });

        const calls = (matching.calls ?? []).map((opt: any) => mapOption(opt, 'CALL'));
        const puts = (matching.puts ?? []).map((opt: any) => mapOption(opt, 'PUT'));
        const allStrikes = [...new Set([
          ...calls.map((c: StockOption) => c.strike),
          ...puts.map((p: StockOption) => p.strike),
        ])].sort((a: any, b: any) => a - b);

        return {
          settlementDate: matching.settlementDate,
          daysToExpiry,
          calls,
          puts,
          strikes: allStrikes,
        } as OptionChain;
      })
    );
  }

  /**
   * Get available settlement dates for options from backend optionGroups
   * Note: ticker parameter is expected to be the stock id
   */
  getOptionSettlementDates(ticker: string): Observable<string[]> {
    const params = new HttpParams().set('period', 'DAY');
    
    return this.http.get<any>(`${environment.apiUrl}/stock/api/listings/${ticker}`, { params }).pipe(
      map((response: any) => {
        const optionGroups = response.optionGroups || [];
        const dates = optionGroups
          .map((og: any) => og.settlementDate)
          .filter((date: string | null) => date !== null && date !== undefined)
          .sort();
        return dates;
      })
    );
  }
}
