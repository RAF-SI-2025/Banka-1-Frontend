import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SidebarComponent } from './sidebar.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { AuthService } from '../../services/auth.service';

/**
 * PR_31 Task 6 specs (azurirano W27b: usaglaseno sa redizajniranim NAV_MANIFEST).
 *
 * `SidebarComponent` cita ulogovanog korisnika kroz `AuthService.getLoggedUser()`
 * i gradi capability set kao `[...permissions, role]` (role string ide u set jer
 * NAV_MANIFEST gate-uje Bankarstvo po roli 'CLIENT'/'CLIENT_TRADING', a Berza po
 * 'SECURITIES_TRADE_*'/'TRADE_UNLIMITED'/'CLIENT_TRADING' permisijama). Mock-ujemo
 * samo `getLoggedUser()` i menjamo joj povrat po slucaju.
 */
describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authMock: { getLoggedUser: jasmine.Spy };

  beforeEach(async () => {
    authMock = {
      // Default: regularni klijent banke — role 'CLIENT' otkljucava Bankarstvo grupu.
      getLoggedUser: jasmine.createSpy('getLoggedUser').and.returnValue({
        email: 'client@banka.com',
        role: 'CLIENT',
        permissions: ['BANKING_BASIC'],
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [SidebarComponent],
      imports: [RouterTestingModule, LucideIconComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('renders Bankarstvo group for a client (role CLIENT)', () => {
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Bankarstvo');
    expect(html).toContain('Pocetna');
  });

  it('hides Berza and Administracija groups for a plain client', () => {
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).not.toContain('Berza');
    expect(html).not.toContain('Administracija');
  });

  it('isActive returns true for current url exact match and nested route', () => {
    fixture.detectChanges();
    component['currentUrl'] = '/accounts/payment/new';
    expect(component.isActive('/accounts')).toBe(true);
    expect(component.isActive('/accounts/payment/new')).toBe(true);
    expect(component.isActive('/exchange')).toBe(false);
  });

  it('shows Berza group for an actuary with SECURITIES_TRADE_UNLIMITED permission', () => {
    // Aktuar agent: role 'AGENT' (nije u nijednoj nav listi -> Bankarstvo ostaje
    // skriven) + 'SECURITIES_TRADE_UNLIMITED' permisija koja otkljucava Berza grupu.
    authMock.getLoggedUser.and.returnValue({
      email: 'agent@banka.com',
      role: 'AGENT',
      permissions: ['SECURITIES_TRADE_UNLIMITED'],
    });
    // Re-create da bi ngOnInit ponovo procitao permisije.
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Berza');
    expect(html).not.toContain('Bankarstvo');
  });
});
