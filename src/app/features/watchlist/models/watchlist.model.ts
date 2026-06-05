export type WatchlistListingType = 'STOCK' | 'FUTURES' | 'FOREX' | 'OPTION';

export interface Watchlist {
  id: number;
  userId: number;
  name: string;
  itemCount: number;
  createdAt: string;
}

export interface WatchlistItem {
  id: number;
  watchlistId: number;
  listingId: number;
  ticker: string;
  name: string;
  price: string;
  change: string;
  volume: number;
  listingType: WatchlistListingType;
  addedAt: string;
}
