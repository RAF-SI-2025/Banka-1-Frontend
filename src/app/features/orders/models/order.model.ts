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
  accountId?: string | null;
  bankAccountId?: string | null;
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
