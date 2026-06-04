export type RecurringInterval =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY';

export type RecurringOrderStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED';

export interface RecurringOrder {
  id: number;

  ticker: string;

  amountRsd: number;

  currency: string;

  interval: RecurringInterval;

  dayOfMonth?: number;

  nextExecution: string;

  status: RecurringOrderStatus;
}