export type WatchlistSecurityType = 'STOCK' | 'FUTURE' | 'FOREX';

export interface WatchlistSecurity {
  id: number;
  ticker: string;
  name: string;
  securityType: WatchlistSecurityType;
  exchange?: string;
  price: number;
  dailyChange: number;
  dailyChangePercent: number;
  volume: number;
  currency?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  securities: WatchlistSecurity[];
}
