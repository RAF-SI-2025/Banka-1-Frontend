import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TopbarComponent } from './topbar.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationPage } from '../../models/notification.model';
import { WatchlistWidgetComponent } from '../../../features/watchlist/components/watchlist-widget/watchlist-widget.component';
import { WatchlistService } from '../../../features/watchlist/services/watchlist.service';

function notif(id: number, read = false): Notification {
  return {
    id,
    type: 'PAYMENT',
    title: `Naslov ${id}`,
    body: `Telo ${id}`,
    read,
    referenceId: null,
    createdAt: '2026-05-19T10:00:00Z',
  };
}

function page(content: Notification[]): NotificationPage {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 8,
  };
}

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;
  let themeService: jasmine.SpyObj<ThemeService>;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let watchlistService: jasmine.SpyObj<WatchlistService>;
  let unreadCount$: BehaviorSubject<number>;

  beforeEach(async () => {
    themeService = jasmine.createSpyObj('ThemeService', ['setTheme'], {
      current: 'system' as const,
    });
    authService = jasmine.createSpyObj('AuthService', ['getLoggedUser', 'logout']);
    authService.getLoggedUser.and.returnValue({
      email: 'aleksa.mojovic@banka.com',
      permissions: [],
    });
    unreadCount$ = new BehaviorSubject<number>(0);
    notificationService = jasmine.createSpyObj(
      'NotificationService',
      ['list', 'markRead', 'markAllRead'],
      { unreadCount$: unreadCount$.asObservable() },
    );
    notificationService.list.and.returnValue(of(page([])));
    notificationService.markRead.and.returnValue(of(void 0));
    notificationService.markAllRead.and.returnValue(of(void 0));

    watchlistService = jasmine.createSpyObj('WatchlistService', [
      'getWatchlists',
      'getItems',
    ]);
    watchlistService.getWatchlists.and.returnValue(of([]));
    watchlistService.getItems.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [TopbarComponent],
      imports: [RouterTestingModule, LucideIconComponent, WatchlistWidgetComponent],
      providers: [
        { provide: ThemeService, useValue: themeService },
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notificationService },
        { provide: WatchlistService, useValue: watchlistService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
  });

  it('computes user initials from logged user email (dotted local part)', () => {
    fixture.detectChanges();
    expect(component.userInitials).toBe('AM');
  });

  it('falls back to first two letters when email has no dot/underscore/dash', () => {
    authService.getLoggedUser.and.returnValue({ email: 'admin@banka.com', permissions: [] });
    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.userInitials).toBe('AD');
  });

  it('returns "?" when user is null', () => {
    authService.getLoggedUser.and.returnValue(null);
    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.userInitials).toBe('?');
  });

  it('opens command palette via global event on Ctrl+K', () => {
    fixture.detectChanges();
    let triggered = false;
    const handler = () => { triggered = true; };
    window.addEventListener('banka:open-command-palette', handler);
    const ev = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    spyOn(ev, 'preventDefault');
    component.onKeydown(ev);
    expect(triggered).toBe(true);
    expect(ev.preventDefault).toHaveBeenCalled();
    window.removeEventListener('banka:open-command-palette', handler);
  });

  it('opens command palette via global event on Cmd+K (metaKey)', () => {
    fixture.detectChanges();
    let triggered = false;
    const handler = () => { triggered = true; };
    window.addEventListener('banka:open-command-palette', handler);
    const ev = new KeyboardEvent('keydown', { key: 'K', metaKey: true });
    spyOn(ev, 'preventDefault');
    component.onKeydown(ev);
    expect(triggered).toBe(true);
    expect(ev.preventDefault).toHaveBeenCalled();
    window.removeEventListener('banka:open-command-palette', handler);
  });

  it('ignores non-K hotkeys', () => {
    fixture.detectChanges();
    let triggered = false;
    const handler = () => { triggered = true; };
    window.addEventListener('banka:open-command-palette', handler);
    const ev = new KeyboardEvent('keydown', { key: 'j', ctrlKey: true });
    spyOn(ev, 'preventDefault');
    component.onKeydown(ev);
    expect(triggered).toBe(false);
    expect(ev.preventDefault).not.toHaveBeenCalled();
    window.removeEventListener('banka:open-command-palette', handler);
  });

  it('setTheme calls ThemeService.setTheme and closes menu', () => {
    fixture.detectChanges();
    component.themeMenuOpen = true;
    component.setTheme('dark');
    expect(themeService.setTheme).toHaveBeenCalledWith('dark');
    expect(component.themeMenuOpen).toBe(false);
  });

  it('iconForTheme returns moon/sun/monitor for dark/light/system', () => {
    expect(component.iconForTheme('dark')).toBe('moon');
    expect(component.iconForTheme('light')).toBe('sun');
    expect(component.iconForTheme('system')).toBe('monitor');
  });

  it('themeLabel returns Serbian labels', () => {
    expect(component.themeLabel('dark')).toBe('Tamna');
    expect(component.themeLabel('light')).toBe('Svetla');
    expect(component.themeLabel('system')).toBe('Sistem');
  });

  it('toggleThemeMenu closes avatar menu when opening', () => {
    component.avatarMenuOpen = true;
    component.themeMenuOpen = false;
    component.toggleThemeMenu();
    expect(component.themeMenuOpen).toBe(true);
    expect(component.avatarMenuOpen).toBe(false);
  });

  it('toggleAvatarMenu closes theme menu when opening', () => {
    component.themeMenuOpen = true;
    component.avatarMenuOpen = false;
    component.toggleAvatarMenu();
    expect(component.avatarMenuOpen).toBe(true);
    expect(component.themeMenuOpen).toBe(false);
  });

  it('closeMenus closes every dropdown', () => {
    component.themeMenuOpen = true;
    component.avatarMenuOpen = true;
    component.notificationsMenuOpen = true;
    component.watchlistMenuOpen = true;
    component.closeMenus();
    expect(component.themeMenuOpen).toBe(false);
    expect(component.avatarMenuOpen).toBe(false);
    expect(component.notificationsMenuOpen).toBe(false);
    expect(component.watchlistMenuOpen).toBe(false);
  });

  it('toggleWatchlistMenu opens the panel and closes the other menus', () => {
    component.themeMenuOpen = true;
    component.avatarMenuOpen = true;
    component.notificationsMenuOpen = true;
    component.toggleWatchlistMenu();
    expect(component.watchlistMenuOpen).toBe(true);
    expect(component.themeMenuOpen).toBe(false);
    expect(component.avatarMenuOpen).toBe(false);
    expect(component.notificationsMenuOpen).toBe(false);
  });

  it('toggleWatchlistMenu closes the panel on a second click', () => {
    component.toggleWatchlistMenu();
    component.toggleWatchlistMenu();
    expect(component.watchlistMenuOpen).toBe(false);
  });

  it('logout calls AuthService.logout (which itself redirects to /login)', () => {
    fixture.detectChanges();
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('breadcrumb is empty array for root URL', () => {
    fixture.detectChanges();
    /* RouterTestingModule starts at '/'; split('/').filter(Boolean) -> []. */
    expect(component.breadcrumb).toEqual([]);
  });

  describe('notifications dropdown', () => {
    it('exposes the service unread-count stream', (done) => {
      unreadCount$.next(4);
      component.unreadCount$.subscribe((c) => {
        expect(c).toBe(4);
        done();
      });
    });

    it('toggleNotificationsMenu opens the panel and loads a preview', () => {
      notificationService.list.and.returnValue(of(page([notif(1), notif(2)])));
      component.toggleNotificationsMenu();
      expect(component.notificationsMenuOpen).toBe(true);
      expect(notificationService.list).toHaveBeenCalledWith(0, 8);
      expect(component.notifications.length).toBe(2);
      expect(component.notificationsLoading).toBe(false);
    });

    it('toggleNotificationsMenu closes theme/avatar menus when opening', () => {
      component.themeMenuOpen = true;
      component.avatarMenuOpen = true;
      component.toggleNotificationsMenu();
      expect(component.notificationsMenuOpen).toBe(true);
      expect(component.themeMenuOpen).toBe(false);
      expect(component.avatarMenuOpen).toBe(false);
    });

    it('toggleNotificationsMenu closing again does not refetch', () => {
      component.toggleNotificationsMenu(); // open -> 1 list call
      notificationService.list.calls.reset();
      component.toggleNotificationsMenu(); // close -> no call
      expect(component.notificationsMenuOpen).toBe(false);
      expect(notificationService.list).not.toHaveBeenCalled();
    });

    it('loadNotificationPreview sets the error flag on failure', () => {
      notificationService.list.and.returnValue(
        throwError(() => new Error('down')),
      );
      component.loadNotificationPreview();
      expect(component.notificationsError).toBe(true);
      expect(component.notificationsLoading).toBe(false);
    });

    it('markNotificationRead flips an unread notification locally', () => {
      const n = notif(1);
      component.markNotificationRead(n);
      expect(notificationService.markRead).toHaveBeenCalledWith(1);
      expect(n.read).toBe(true);
    });

    it('markNotificationRead is a no-op for an already-read notification', () => {
      component.markNotificationRead(notif(1, true));
      expect(notificationService.markRead).not.toHaveBeenCalled();
    });

    it('markAllNotificationsRead flips every loaded notification', () => {
      component.notifications = [notif(1), notif(2), notif(3, true)];
      component.markAllNotificationsRead();
      expect(notificationService.markAllRead).toHaveBeenCalled();
      expect(component.notifications.every((n) => n.read)).toBe(true);
    });
  });
});
