import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TopbarComponent } from './topbar.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AppNotification } from '../../../shared/models/app-notification.model';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import { OtcService } from '../../../features/otc/services/otc.service';

function notification(id: string, read = false): AppNotification {
  return {
    id,
    category: 'OTC',
    kind: 'OTC_COUNTER_OFFER',
    message: `Poruka ${id}`,
    createdAt: new Date().toISOString(),
    read,
    dedupeKey: id,
  };
}

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;
  let themeService: jasmine.SpyObj<ThemeService>;
  let authService: jasmine.SpyObj<AuthService>;
  let appNotifications: jasmine.SpyObj<AppNotificationService>;
  let otcService: jasmine.SpyObj<OtcService>;
  let notificationsSubject: BehaviorSubject<AppNotification[]>;

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
    themeService = jasmine.createSpyObj('ThemeService', ['setTheme'], {
      current: 'system' as const,
    });
    authService = jasmine.createSpyObj('AuthService', ['getLoggedUser', 'logout']);
    authService.getLoggedUser.and.returnValue({
      email: 'aleksa.mojovic@banka.com',
      permissions: [],
    });
    appNotifications = jasmine.createSpyObj('AppNotificationService', [
      'markAllRead',
      'markRead',
      'hydrateFromStorage',
      'clear',
    ], {
      snapshot: [],
      notifications$: notificationsSubject.asObservable(),
    });
    otcService = jasmine.createSpyObj('OtcService', ['clearPollCache']);

    await TestBed.configureTestingModule({
      declarations: [TopbarComponent],
      imports: [RouterTestingModule, LucideIconComponent],
      providers: [
        { provide: ThemeService, useValue: themeService },
        { provide: AuthService, useValue: authService },
        { provide: AppNotificationService, useValue: appNotifications },
        { provide: OtcService, useValue: otcService },
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

  it('closeMenus closes all dropdown menus', () => {
    component.themeMenuOpen = true;
    component.avatarMenuOpen = true;
    component.notificationMenuOpen = true;
    component.closeMenus();
    expect(component.themeMenuOpen).toBe(false);
    expect(component.avatarMenuOpen).toBe(false);
    expect(component.notificationMenuOpen).toBe(false);
  });

  it('logout clears notifications and calls AuthService.logout', () => {
    fixture.detectChanges();
    component.logout();
    expect(appNotifications.clear).toHaveBeenCalled();
    expect(otcService.clearPollCache).toHaveBeenCalled();
    expect(authService.logout).toHaveBeenCalled();
  });

  describe('notifications', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('toggleNotificationMenu() otvara i zatvara meni', () => {
      expect(component.notificationMenuOpen).toBe(false);

      component.toggleNotificationMenu();
      expect(component.notificationMenuOpen).toBe(true);

      component.toggleNotificationMenu();
      expect(component.notificationMenuOpen).toBe(false);
    });

    it('toggleNotificationMenu() zatvara theme i avatar meni', () => {
      component.themeMenuOpen = true;
      component.avatarMenuOpen = true;

      component.toggleNotificationMenu();

      expect(component.notificationMenuOpen).toBe(true);
      expect(component.themeMenuOpen).toBe(false);
      expect(component.avatarMenuOpen).toBe(false);
    });

    it('unreadNotificationCount broji samo nepročitane', () => {
      notificationsSubject.next([
        notification('a'),
        notification('b'),
        notification('c', true),
      ]);

      expect(component.unreadNotificationCount).toBe(2);
    });

    it('notificationBellAriaLabel uključuje broj nepročitanih', () => {
      notificationsSubject.next([notification('a'), notification('b')]);

      expect(component.notificationBellAriaLabel()).toContain('2 nova obaveštenja');
    });

    it('openNotification() zatvara meni i poziva markRead', () => {
      const n = notification('x', false);
      component.notificationMenuOpen = true;

      component.openNotification(n);

      expect(component.notificationMenuOpen).toBe(false);
      expect(appNotifications.markRead).toHaveBeenCalledWith('x');
    });

    it('openNotification() navigira kada postoji route', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl');
      const n = { ...notification('y'), route: '/otc' };

      component.openNotification(n);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/otc');
    });

    it('Escape zatvara notification meni', () => {
      component.notificationMenuOpen = true;
      component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.notificationMenuOpen).toBe(false);
    });

    it('ArrowDown fokusira prvu stavku u notification meniju', () => {
      notificationsSubject.next([notification('a'), notification('b')]);
      component.notificationMenuOpen = true;
      fixture.detectChanges();

      const focusSpy = spyOn<any>(component, 'focusNotificationMenuItem').and.callThrough();
      component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      expect(focusSpy).toHaveBeenCalledWith(0);
    });

    it('prestaje da prima notifications$ posle ngOnDestroy', () => {
      notificationsSubject.next([notification('1')]);
      expect(component.notifications.length).toBe(1);

      fixture.destroy();

      notificationsSubject.next([notification('1'), notification('2')]);
      expect(component.notifications.length).toBe(1);
    });
  });

  it('breadcrumb is empty array for root URL', () => {
    fixture.detectChanges();
    /* RouterTestingModule starts at '/'; split('/').filter(Boolean) -> []. */
    expect(component.breadcrumb).toEqual([]);
  });
});
