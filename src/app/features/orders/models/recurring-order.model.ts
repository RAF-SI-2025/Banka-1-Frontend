export type RecurringInterval =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY';

export type RecurringOrderStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED';

export type RecurringOrderMode = 'BY_QUANTITY' | 'BY_AMOUNT';

export type OrderDirection = 'BUY' | 'SELL';

export interface RecurringOrder {
  id: number;
  listingId: number;
  direction: OrderDirection;
  mode: RecurringOrderMode;
  value: number;
  accountId: number;
  cadence: RecurringInterval;
  nextRun: string;
  status: RecurringOrderStatus;
}