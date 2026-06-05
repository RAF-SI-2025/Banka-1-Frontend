export type RecurringCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RecurringMode = 'BY_AMOUNT' | 'BY_QUANTITY';
export type RecurringDirection = 'BUY' | 'SELL';

export interface RecurringOrder {
  id: number;
  userId: number;
  listingId: number;
  direction: RecurringDirection;
  mode: RecurringMode;
  value: number;
  accountId: number;
  cadence: RecurringCadence;
  nextRun: string;
  active: boolean;
  createdAt: string;
}

export interface CreateRecurringOrderPayload {
  listingId: number;
  direction: RecurringDirection;
  mode: RecurringMode;
  value: number;
  accountId: number;
  cadence: RecurringCadence;
  dayOfMonth?: number | null;
  nextRun?: string | null;
}
