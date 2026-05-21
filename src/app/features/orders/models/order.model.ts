export type OrderDirection = 'BUY' | 'SELL';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'DONE'
  | 'CANCELLED';

export type PurchaseFor = 'INVESTMENT_FUND' | 'BANK';

export interface CreateOrderRequest {
  listingId: number;
  quantity: number;
  limitValue?: number | null;
  stopValue?: number | null;
  allOrNone: boolean;
  margin: boolean;
  accountId: number;
  purchaseFor?: PurchaseFor;
  fundId?: number;
}

export interface OrderResponse {
  id: number;
  userId: number;
  listingId: number;
  orderType: OrderType;
  quantity: number;
  contractSize: number;
  pricePerUnit: number;
  limitValue?: number | null;
  stopValue?: number | null;
  direction: OrderDirection;
  status: OrderStatus;
  approvedBy?: number | null;
  isDone: boolean;
  lastModification: string;
  remainingPortions: number;
  afterHours: boolean;
  exchangeClosed: boolean;
  allOrNone: boolean;
  margin: boolean;
  accountId?: number | null;
  approximatePrice: number;
  fee: number;
}

export interface MyOrderResponse extends OrderResponse {
  ticker?: string;
  securityTicker?: string;
  listingTicker?: string;

  securityName?: string;
  listingName?: string;

  securityType?: 'STOCK' | 'FUTURE' | 'FOREX';

  executionPrice?: number;
  executedPrice?: number;

  createdAt?: string;
  creationDate?: string;
  createdDate?: string;

  executedAt?: string;
  executionDate?: string;
  doneAt?: string;

  paidFee?: number;
  commission?: number;

  listing?: {
    ticker?: string;
    name?: string;
    type?: 'STOCK' | 'FUTURE' | 'FOREX';
    securityType?: 'STOCK' | 'FUTURE' | 'FOREX';
  };

  security?: {
    ticker?: string;
    name?: string;
    type?: 'STOCK' | 'FUTURE' | 'FOREX';
    securityType?: 'STOCK' | 'FUTURE' | 'FOREX';
  };
}
