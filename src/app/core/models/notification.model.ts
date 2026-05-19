/**
 * WP-21 (Celina 2): in-app notification model.
 *
 * Mirrors {@code InAppNotificationDto} returned by `notification-service`
 * (routed through the gateway at `/notifications`). The backend feed is
 * scoped to the authenticated caller and ordered newest-first.
 */
export interface Notification {
  id: number;
  /** Domain category, e.g. `PAYMENT`, `CARD`, `LOAN`, `SECURITY` (free-form). */
  type: string;
  title: string;
  body: string;
  /** Whether the caller has already read this notification. */
  read: boolean;
  /**
   * Optional id of the domain entity this notification refers to
   * (e.g. a transaction / loan id). `null` when not applicable.
   */
  referenceId: number | null;
  /** ISO-8601 timestamp string assigned by the backend. */
  createdAt: string;
}

/**
 * Spring Data `Page` envelope as returned by `GET /notifications`.
 * Only the fields the UI consumes are typed.
 */
export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  /** 0-indexed page number. */
  number: number;
  size: number;
}

/** Shape of `GET /notifications/unread-count`. */
export interface UnreadCountResponse {
  count: number;
}
