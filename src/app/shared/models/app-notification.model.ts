export type AppNotificationCategory = 'OTC';

export type AppNotificationKind =
  | 'OTC_COUNTER_OFFER'
  | 'OTC_OFFER_ACCEPTED'
  | 'OTC_OFFER_REJECTED'
  | 'OTC_OFFER_WITHDRAWN'
  | 'OTC_CONTRACT_EXPIRING';

export interface AppNotification {
  id: string;
  category: AppNotificationCategory;
  kind: AppNotificationKind;
  message: string;
  createdAt: string;
  read: boolean;
  route?: string;
  /** Stable key for deduplication (e.g. offer id or contract id). */
  dedupeKey: string;
}
