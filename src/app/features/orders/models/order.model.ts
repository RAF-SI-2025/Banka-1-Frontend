export type OrderDirection = 'BUY' | 'SELL';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'DONE'
  | 'CANCELLED';

export interface CreateOrderRequest {
  listingId: number;
  quantity: number;
  limitValue?: number | null;
  stopValue?: number | null;
  allOrNone: boolean;
  margin: boolean;
  accountId: number;
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


export type SecurityTypeFilter =
  | 'ALL'
  | 'STOCK'
  | 'FOREX'
  | 'FUTURES'
  | 'OPTION';

export type MyOrderStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'DONE';

export type MyOrderTypeFilter =
  | 'ALL'
  | 'MARKET'
  | 'LIMIT'
  | 'STOP'
  | 'STOP_LIMIT';

export interface MyOrder {
  id: number;
  orderType: OrderType;
  ticker: string;
  securityName: string;
  securityType: string;
  quantity: number;
  executionPrice: number | null;
  status: OrderStatus;
  createdAt: string | null;
  executedAt: string | null;
  paidFee: number | null;
}

export interface MyOrdersPageResponse {
  content: MyOrderRaw[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export interface MyOrderRaw {
  id?: number;
  orderId?: number;

  orderType?: OrderType;
  type?: OrderType;

  ticker?: string;
  symbol?: string;
  securityTicker?: string;
  listingTicker?: string;

  securityName?: string;
  listingName?: string;
  name?: string;

  securityType?: string;
  listingType?: string;
  assetType?: string;

  quantity?: number;

  executionPrice?: number;
  pricePerUnit?: number;
  averageExecutionPrice?: number;

  status?: OrderStatus;

  createdAt?: string;
  creationDate?: string;
  createdDate?: string;
  lastModification?: string;

  executedAt?: string;
  executionDate?: string;
  doneAt?: string;

  paidFee?: number;
  fee?: number;
  commission?: number;
}
