/**
 * Types of securities
 */
export type SecurityType = 'STOCK' | 'FUTURE' | 'FOREX';

/**
 * Base interface for all securities
 */
export interface Security {
  id: number;
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  volume: number;
  maintenanceMargin: number;
  initialMarginCost: number;
  type: SecurityType;
  lastUpdated: string;
  ask?: number;
  bid?: number;
}

/**
 * Stock-specific fields
 */
export interface Stock extends Security {
  type: 'STOCK';
  high: number;
  low: number;
  open: number;
  previousClose: number;
  bid: number;
  ask: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  dividendYield?: number;
  dollarVolume?: number;
  outstandingShares?: number;
  contractSize?: number;
  priceHistory?: PricePoint[];
}

/**
 * Future-specific fields
 */
export interface Future extends Security {
  type: 'FUTURE';
  settlementDate: string;
  contractSize: number;
  openInterest: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  bid: number;
  ask: number;
}

/**
 * Forex pair
 */
export interface Forex extends Security {
  type: 'FOREX';
  baseCurrency: string;
  quoteCurrency: string;
  bid: number;
  ask: number;
  spread: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

/**
 * Option for stocks
 */
export interface StockOption {
  strike: number;
  type: 'CALL' | 'PUT';
  last: number;
  theta: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  inTheMoney: boolean;
}

/**
 * Option chain for a settlement date
 */
export interface OptionChain {
  settlementDate: string;
  daysToExpiry: number;
  calls: StockOption[];
  puts: StockOption[];
  strikes: number[];
}

/**
 * Historical price data point
 */
export interface PricePoint {
  date: string;
  price: number;
  volume?: number;
  change?: number;
  changePercent?: number;
  dollarVolume?: number;
}

/**
 * Price history response
 */
export interface PriceHistory {
  ticker: string;
  period: string;
  data: PricePoint[];
}

/**
 * Filter options for securities list
 */
export interface SecuritiesFilters {
  search?: string;
  exchange?: string;
  priceMin?: number;
  priceMax?: number;
  volumeMin?: number;
  volumeMax?: number;
  marginMin?: number;
  marginMax?: number;
  settlementDateFrom?: string;
  settlementDateTo?: string;
  askMin?: number;
  askMax?: number;
  bidMin?: number;
  bidMax?: number;
}

/**
 * Sort options
 */
export type SortField = 'price' | 'volume' | 'change' | 'margin' | 'ticker' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Paginated response
 */
export interface SecuritiesPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
