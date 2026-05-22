import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { Theme, ThemeService } from '../../services/theme.service';
import { AppNotification } from '../../../shared/models/app-notification.model';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import { OtcService } from '../../../features/otc/services/otc.service';
import { WatchlistService } from '../../../features/watchlist/services/watchlist.service';
import { WatchlistSecurity } from '../../../features/watchlist/models/watchlist.model';

type ThemeIcon = 'sun' | 'moon' | 'monitor';

const THEME_ICONS: Record<Theme, ThemeIcon> = {
  dark: 'moon',
  light: 'sun',
  system: 'monitor',
};

const THEME_LABELS: Record<Theme, string> = {
  dark: 'Tamna',
  light: 'Svetla',
  system: 'Sistem',
};

const COMMAND_PALETTE_EVENT = 'banka:open-command-palette';

/**
 * PR_31 Task 7: TopbarComponent
 *
 * Sticky horizontalna traka iznad glavnog sadrzaja. Sadrzi:
 *   - levo: route breadcrumb derived iz `Router.url`.
 *   - desno: `Pretrazi` trigger (otvara command palette kroz globalni event),
 *     theme toggle dropdown (3 opcije: Sistem / Svetla / Tamna), notifikacije (zvonce),
 *     avatar krug sa user inicijalima + dropdown (Profil / Odjava).
 *
 * Ctrl+K / Cmd+K hotkey otvara command palette preko `window.dispatchEvent`
 * (`banka:open-command-palette`) — Task 8 ce dodati listener u
 * CommandPaletteComponent.
 *
 * `AuthService.getLoggedUser()` vraca samo `{ email, permissions }` (verified u
 * auth.service.ts:424) — nema firstName/lastName / ime/prezime, pa inicijale
 * derivimo iz email lokalnog dela (split po `.` `_` `-`, prva slova segmenata).
 */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  breadcrumb: string[] = [];
  themeMenuOpen = false;
  avatarMenuOpen = false;
  notificationMenuOpen = false;
  notifications: AppNotification[] = [];
  private notificationMenuFocusIndex = -1;
  private readonly destroy$ = new Subject<void>();
  watchlistMenuOpen = false;

  userInitials = '';
  watchlistPreview: WatchlistSecurity[] = [];

  private sub?: Subscription;
  private watchlistSub?: Subscription;

  readonly themes: Theme[] = ['system', 'light', 'dark'];

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
    private appNotifications: AppNotificationService,
    private otcService: OtcService,
    private watchlistService: WatchlistService,
  ) {}

  ngOnInit(): void {
    this.refreshBreadcrumb(this.router.url);
    this.userInitials = this.computeInitials();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )

    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.refreshBreadcrumb((e as NavigationEnd).urlAfterRedirects);
      });

    this.appNotifications.hydrateFromStorage();
    this.notifications = this.appNotifications.snapshot;
    this.appNotifications.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.notifications = items;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get unreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  notificationBellAriaLabel(): string {
    const count = this.unreadNotificationCount;
    if (count === 0) return 'Notifikacije';
    if (count === 1) return 'Notifikacije, 1 novo obaveštenje';
    return `Notifikacije, ${count} nova obaveštenja`;
  }

  unreadBadgeAriaLabel(): string {
    const count = this.unreadNotificationCount;
    return count === 1 ? '1 novo obaveštenje' : `${count} novih obaveštenja`;
  }

  trackByNotificationId(_index: number, n: AppNotification): string {
    return n.id;
  }

  onNotificationMenuKeydown(event: KeyboardEvent, n: AppNotification): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openNotification(n);
    }
  }

  toggleNotificationMenu(): void {
    const next = !this.notificationMenuOpen;
    this.closeMenus();
    this.notificationMenuOpen = next;
    this.notificationMenuFocusIndex = -1;
  }

  openNotification(n: AppNotification): void {
    this.notificationMenuOpen = false;
    this.appNotifications.markRead(n.id);
    if (n.route) {
      this.router.navigateByUrl(n.route);
    }
    this.watchlistSub = this.watchlistService.watchlists$.subscribe((watchlists) => {
      this.watchlistPreview = watchlists
        .flatMap((watchlist) => watchlist.securities)
        .slice(0, 4);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.watchlistSub?.unsubscribe();
  }

  setTheme(t: Theme): void {
    this.theme.setTheme(t);
    this.themeMenuOpen = false;
  }

  openCommandPalette(): void {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
  }

  toggleWatchlistMenu(): void {
    const next = !this.watchlistMenuOpen;
    this.closeMenus();
    this.watchlistMenuOpen = next;
  }

  toggleThemeMenu(): void {
    const next = !this.themeMenuOpen;
    this.closeMenus();
    this.themeMenuOpen = next;
  }

  toggleAvatarMenu(): void {
    const next = !this.avatarMenuOpen;
    this.closeMenus();
    this.avatarMenuOpen = next;
  }

  closeMenus(): void {
    this.themeMenuOpen = false;
    this.avatarMenuOpen = false;
    this.notificationMenuOpen = false;
    this.notificationMenuFocusIndex = -1;
  }

  logout(): void {
    this.appNotifications.clear();
    this.otcService.clearPollCache();
    /* `AuthService.logout()` vec navigira na /login (auth.service.ts:188), tako
       da ne treba dodatni `router.navigate`. */
    this.watchlistMenuOpen = false;
  }

  logout(): void {
    this.auth.logout();
  }

  iconForTheme(t: Theme): ThemeIcon {
    return THEME_ICONS[t];
  }

  themeLabel(t: Theme): string {
    return THEME_LABELS[t];
  }

  formatHeaderPrice(security: WatchlistSecurity): string {
    const currency = security.currency ?? 'USD';

    return `${this.formatNumber(security.price)} ${currency}`;
  }

  formatHeaderChange(security: WatchlistSecurity): string {
    const sign = security.dailyChangePercent >= 0 ? '+' : '';

    return `${sign}${this.formatNumber(security.dailyChangePercent)}%`;
  }

  getHeaderChangeClass(security: WatchlistSecurity): string {
    if (security.dailyChangePercent > 0) {
      return 'quick-change-positive';
    }

    if (security.dailyChangePercent < 0) {
      return 'quick-change-negative';
    }

    return 'quick-change-neutral';
  }

  formatHeaderVolume(security: WatchlistSecurity): string {
    return new Intl.NumberFormat('sr-RS').format(security.volume);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.notificationMenuOpen || this.themeMenuOpen || this.avatarMenuOpen) {
        this.closeMenus();
        return;
      }
    }

    if (this.notificationMenuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      this.notificationMenuFocusIndex += e.key === 'ArrowDown' ? 1 : -1;
      this.focusNotificationMenuItem(this.notificationMenuFocusIndex);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.openCommandPalette();
    }

    if (e.key === 'Escape') {
      this.closeMenus();
    }
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private focusNotificationMenuItem(index: number): void {
    const menu = document.getElementById('notification-menu');
    if (!menu) return;

    const items = Array.from(
      menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
    );
    if (items.length === 0) return;

    const normalized =
      ((index % items.length) + items.length) % items.length;
    items[normalized].focus();
    this.notificationMenuFocusIndex = normalized;
  }

  private refreshBreadcrumb(url: string): void {
    const segments = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.breadcrumb = segments;
  }

  private computeInitials(): string {
    const user = this.auth.getLoggedUser();

    if (!user?.email) {
      return '?';
    }

    const local = user.email.split('@')[0] ?? '';

    if (!local) {
      return '?';
    }

    const parts = local.split(/[._-]+/).filter(Boolean);

    if (parts.length >= 2) {
      return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase() || '?';
    }

    return local.slice(0, 2).toUpperCase() || '?';
  }
}
