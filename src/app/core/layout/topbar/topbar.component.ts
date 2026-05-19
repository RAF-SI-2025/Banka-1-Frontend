import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { Theme, ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification.model';

/** How many notifications the bell dropdown preview shows. */
const NOTIFICATION_PREVIEW_SIZE = 8;

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
 *     theme toggle dropdown (3 opcije: Sistem / Svetla / Tamna), bell icon
 *     placeholder, avatar krug sa user inicijalima + dropdown (Profil / Odjava).
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
  notificationsMenuOpen = false;
  /** WP-22 (Celina 3): watchlist quick-access dropdown open flag. */
  watchlistMenuOpen = false;
  userInitials = '';
  private sub?: Subscription;

  readonly themes: Theme[] = ['system', 'light', 'dark'];

  /** Live unread-count for the bell badge (hidden when 0). */
  readonly unreadCount$: Observable<number>;
  /** Latest few notifications shown inside the bell dropdown. */
  notifications: Notification[] = [];
  notificationsLoading = false;
  notificationsError = false;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.refreshBreadcrumb(this.router.url);
    this.userInitials = this.computeInitials();
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.refreshBreadcrumb((e as NavigationEnd).urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setTheme(t: Theme): void {
    this.theme.setTheme(t);
    this.themeMenuOpen = false;
  }

  openCommandPalette(): void {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
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

  toggleNotificationsMenu(): void {
    const next = !this.notificationsMenuOpen;
    this.closeMenus();
    this.notificationsMenuOpen = next;
    /* Lazily fetch the preview each time the panel opens so it is fresh. */
    if (this.notificationsMenuOpen) {
      this.loadNotificationPreview();
    }
  }

  /**
   * WP-22 (Celina 3): toggles the watchlist quick-access dropdown.
   * The {@link WatchlistWidgetComponent} fetches lazily off its `open` input.
   */
  toggleWatchlistMenu(): void {
    const next = !this.watchlistMenuOpen;
    this.closeMenus();
    this.watchlistMenuOpen = next;
  }

  closeMenus(): void {
    this.themeMenuOpen = false;
    this.avatarMenuOpen = false;
    this.notificationsMenuOpen = false;
    this.watchlistMenuOpen = false;
  }

  /** Fetches the latest few notifications for the dropdown preview. */
  loadNotificationPreview(): void {
    this.notificationsLoading = true;
    this.notificationsError = false;
    this.notificationService.list(0, NOTIFICATION_PREVIEW_SIZE).subscribe({
      next: (page) => {
        this.notifications = page?.content ?? [];
        this.notificationsLoading = false;
      },
      error: () => {
        this.notificationsLoading = false;
        this.notificationsError = true;
      },
    });
  }

  /** Marks one notification read from the dropdown and flips it locally. */
  markNotificationRead(n: Notification): void {
    if (n.read) {
      return;
    }
    this.notificationService.markRead(n.id).subscribe({
      next: () => {
        n.read = true;
      },
      /* Silent: the dropdown is a peripheral surface, no toast noise. */
      error: () => undefined,
    });
  }

  /** Marks every notification read from the dropdown. */
  markAllNotificationsRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => this.notifications.forEach((n) => (n.read = true)),
      error: () => undefined,
    });
  }

  logout(): void {
    /* `AuthService.logout()` vec navigira na /login (auth.service.ts:188), tako
       da ne treba dodatni `router.navigate`. */
    this.auth.logout();
  }

  iconForTheme(t: Theme): ThemeIcon {
    return THEME_ICONS[t];
  }

  themeLabel(t: Theme): string {
    return THEME_LABELS[t];
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.openCommandPalette();
    }
  }

  private refreshBreadcrumb(url: string): void {
    const segments = url.split('?')[0].split('#')[0].split('/').filter(Boolean);
    this.breadcrumb = segments;
  }

  /**
   * Email "aleksa.mojovic@banka.com" -> "AM".
   * Email "admin@banka.com" -> "AD" (fallback: prva dva slova local part-a).
   * Bez korisnika -> "?".
   */
  private computeInitials(): string {
    const user = this.auth.getLoggedUser();
    if (!user?.email) return '?';
    const local = user.email.split('@')[0] ?? '';
    if (!local) return '?';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase() || '?';
    }
    return local.slice(0, 2).toUpperCase() || '?';
  }
}
