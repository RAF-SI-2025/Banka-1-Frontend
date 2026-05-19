import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subscription, timer } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
  Notification,
  NotificationPage,
  UnreadCountResponse,
} from '../models/notification.model';

/**
 * Poll cadence for the unread-count badge. Exported so specs can drive the
 * fake timer deterministically. There is no WebSocket/SSE channel — polling
 * is the only realtime option available.
 */
export const UNREAD_POLL_INTERVAL_MS = 60_000;

/**
 * WP-21 (Celina 2): in-app notification feed client.
 *
 * <p>Wraps the JWT-secured `notification-service` endpoints exposed through
 * the gateway at `/notifications`. The {@link AuthInterceptor} attaches the
 * `Authorization` header automatically — callers never set it.
 *
 * <p>{@link unreadCount$} is a hot {@link BehaviorSubject} stream that the
 * topbar bell badge binds to. It is refreshed:
 *   - immediately on construction,
 *   - every {@link UNREAD_POLL_INTERVAL_MS} ms via a `timer` poll,
 *   - eagerly after any `markRead` / `markAllRead` action.
 * A failed poll is swallowed and the last known value is retained, so a
 * transient backend hiccup never breaks the stream.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  /** Latest unread-notification count (starts at 0). */
  readonly unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  private readonly pollSub: Subscription;

  constructor(private readonly http: HttpClient) {
    /* timer(0, period) fires immediately then on every interval. */
    this.pollSub = timer(0, UNREAD_POLL_INTERVAL_MS).subscribe(() =>
      this.refreshUnreadCount(),
    );
  }

  ngOnDestroy(): void {
    this.pollSub.unsubscribe();
  }

  /**
   * Fetches one page of the caller's notification feed, newest first.
   * @param page 0-indexed page number.
   * @param size page size.
   */
  list(page = 0, size = 10): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<NotificationPage>(this.baseUrl, { params });
  }

  /** One-shot fetch of the current unread count. */
  unreadCount(): Observable<number> {
    return this.http
      .get<UnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(map((res) => res?.count ?? 0));
  }

  /**
   * Marks a single notification as read, then refreshes {@link unreadCount$}.
   * The refresh is wired with `tap` so it fires for every subscriber exactly
   * once the PATCH succeeds.
   */
  markRead(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.baseUrl}/${id}/read`, {})
      .pipe(tap(() => this.refreshUnreadCount()));
  }

  /**
   * Marks every notification of the caller as read, then refreshes
   * {@link unreadCount$}.
   */
  markAllRead(): Observable<void> {
    return this.http
      .patch<void>(`${this.baseUrl}/read-all`, {})
      .pipe(tap(() => this.refreshUnreadCount()));
  }

  /**
   * Re-fetches the unread count and pushes it onto {@link unreadCount$}.
   * Failures are swallowed — the previous value is kept.
   */
  refreshUnreadCount(): void {
    this.unreadCount()
      .pipe(catchError(() => EMPTY))
      .subscribe((count) => this.unreadCountSubject.next(count));
  }
}
