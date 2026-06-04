import { Injectable, OnDestroy } from '@angular/core';
import { forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, exhaustMap, retry, switchMap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import { OtcService } from './otc.service';
import {
  detectContractExpiryNotifications,
  detectOfferNotifications,
  OfferSnapshot,
  toOfferSnapshot,
} from './otc-notification-diff';

/** Produkcija: 30s. Manji interval samo u dev/E2E, nikad ispod 5s u dev-u. */
export const OTC_NOTIFICATION_POLL_MS_DEFAULT = 30_000;
const OTC_NOTIFICATION_POLL_MS_DEV_MIN = 5_000;

declare global {
  interface Window {
    /**
     * Samo non-production (npr. Cypress). U produkciji se ignoriše.
     * Preporuka: ≥ 5000 ms. E2E može koristiti 5000 da ubrza test bez 500 ms spam-a.
     */
    __OTC_POLL_MS?: number;
  }
}

/** Real-time preko WebSocket-a — buduće poboljšanje; trenutno HTTP poll. */
export function resolveOtcNotificationPollMs(): number {
  if (environment.production) {
    return OTC_NOTIFICATION_POLL_MS_DEFAULT;
  }

  const override =
    typeof window !== 'undefined' ? window.__OTC_POLL_MS : undefined;
  if (override == null || !Number.isFinite(override) || override <= 0) {
    return OTC_NOTIFICATION_POLL_MS_DEFAULT;
  }

  return Math.max(OTC_NOTIFICATION_POLL_MS_DEV_MIN, override);
}
const OTC_PERMISSIONS = [
  'OTC_TRADE',
  'CLIENT_TRADING',
  'TRADE_UNLIMITED',
  'SECURITIES_TRADE_UNLIMITED',
  'SECURITIES_TRADE_LIMITED',
];

/**
 * Celina 4 — OTC notifikacije u aplikaciji.
 * Prati aktivne ponude i ugovore; email obaveštenja šalje backend preko notification-service-a.
 *
 * Otpornost na mrežne greške:
 * - `OtcService.getActiveOffers()` retry + fallback ako `/api/interbank/otc/negotiations` padne.
 * - `pollOnce()` retry (3×, exponential backoff) + catchError — monitor se ne gasi.
 */
@Injectable({ providedIn: 'root' })
export class OtcNotificationMonitorService implements OnDestroy {
  private pollSub?: Subscription;
  private offerSnapshot = new Map<string, OfferSnapshot>();
  private contractExpiryNotified = new Set<string>();
  private initialPollDone = false;

  constructor(
    private otcService: OtcService,
    private auth: AuthService,
    private notifications: AppNotificationService,
  ) {}

  start(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;

    if (!this.canMonitor()) return;

    // exhaustMap: ne prekidaj poll koji još traje (npr. interbank retry ~6s) — switchMap bi
    // otkazao poll pre ažuriranja snapshot-a i isInitial bi ostao true.
    this.pollSub = timer(0, resolveOtcNotificationPollMs())
      .pipe(
        exhaustMap(() =>
          this.pollOnce().pipe(
            retry({
              count: 3,
              delay: (_err, retryCount) => timer(2 ** retryCount * 1000),
            }),
            catchError((err) => {
              console.error('OTC notification poll failed:', err);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe();
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.offerSnapshot.clear();
    this.contractExpiryNotified.clear();
    this.initialPollDone = false;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private canMonitor(): boolean {
    if (!this.auth.getToken()) return false;
    const user = this.auth.getLoggedUser();
    if (!user?.permissions?.length) return false;
    return user.permissions.some((p) => OTC_PERMISSIONS.includes(p));
  }

  private pollOnce() {
    return forkJoin({
      offers: this.otcService.getActiveOffers().pipe(catchError(() => of([]))),
      contracts: this.otcService.myContracts('ACTIVE').pipe(catchError(() => of([]))),
    }).pipe(
      switchMap(({ offers, contracts }) => {
        const userId = this.auth.getUserIdFromToken();
        const isInitial = !this.initialPollDone;

        const offerEvents = detectOfferNotifications(
          this.offerSnapshot,
          offers,
          userId,
          isInitial,
        );

        const contractEvents = detectContractExpiryNotifications(contracts, userId).filter(
          (n) => {
            if (this.contractExpiryNotified.has(n.dedupeKey)) return false;
            this.contractExpiryNotified.add(n.dedupeKey);
            return true;
          },
        );

        for (const item of offerEvents) {
          this.notifications.push({
            category: 'OTC',
            kind: item.kind,
            message: item.message,
            dedupeKey: item.dedupeKey,
            route: item.route,
            showToast: true,
          });
        }

        for (const item of contractEvents) {
          this.notifications.push({
            category: 'OTC',
            kind: item.kind,
            message: item.message,
            dedupeKey: item.dedupeKey,
            route: item.route,
            showToast: !isInitial,
          });
        }

        this.offerSnapshot = new Map(
          offers.map((o) => {
            const snap = toOfferSnapshot(o);
            return [snap.key, snap] as const;
          }),
        );
        this.initialPollDone = true;
        return of(null);
      }),
    );
  }
}
