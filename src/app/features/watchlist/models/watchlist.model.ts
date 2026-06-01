export type WatchlistSecurityType = 'STOCK' | 'FUTURE' | 'FOREX' | 'OPTION';

export interface WatchlistItemDto {
  id: number;
  listingId: number;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  listingType: WatchlistSecurityType;
}

export interface Watchlist {
  id: number;
  name: string;
  items?: WatchlistItemDto[];
}
