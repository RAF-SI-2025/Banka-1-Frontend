import { SecurityType } from '../../securities/models/security.model';

export interface WatchlistSecurity {
  id: number;
  ticker: string;
  name: string;
  type: SecurityType;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  volume: number;
  exchange: string;
}

export interface Watchlist {
  id: string;
  name: string;
  securities: WatchlistSecurity[];
}
