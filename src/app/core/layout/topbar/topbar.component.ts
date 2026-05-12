import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { Theme, ThemeService } from '../../services/theme.service';

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
  userInitials = '';
  private sub?: Subscription;

  readonly themes: Theme[] = ['system', 'light', 'dark'];

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router,
  ) {}

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

  closeMenus(): void {
    this.themeMenuOpen = false;
    this.avatarMenuOpen = false;
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
