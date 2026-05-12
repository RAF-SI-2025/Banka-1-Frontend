import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TopbarComponent } from './topbar.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;
  let themeService: jasmine.SpyObj<ThemeService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    themeService = jasmine.createSpyObj('ThemeService', ['setTheme'], {
      current: 'system' as const,
    });
    authService = jasmine.createSpyObj('AuthService', ['getLoggedUser', 'logout']);
    authService.getLoggedUser.and.returnValue({
      email: 'aleksa.mojovic@banka.com',
      permissions: [],
    });

    await TestBed.configureTestingModule({
      declarations: [TopbarComponent],
      imports: [RouterTestingModule, LucideIconComponent],
      providers: [
        { provide: ThemeService, useValue: themeService },
        { provide: AuthService, useValue: authService },
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

  it('closeMenus closes both menus', () => {
    component.themeMenuOpen = true;
    component.avatarMenuOpen = true;
    component.closeMenus();
    expect(component.themeMenuOpen).toBe(false);
    expect(component.avatarMenuOpen).toBe(false);
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
});
