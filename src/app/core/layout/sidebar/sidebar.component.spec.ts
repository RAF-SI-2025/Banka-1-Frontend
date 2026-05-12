import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SidebarComponent } from './sidebar.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { AuthService } from '../../services/auth.service';

/**
 * PR_31 Task 6 specs.
 *
 * AuthService API stvarno koristi `getLoggedUser()` koji vraca
 * `{ email, permissions } | null`. Mock-ujemo samo tu metodu i menjamo joj povrat
 * po slucaju.
 */
describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authMock: { getLoggedUser: jasmine.Spy };

  beforeEach(async () => {
    authMock = {
      getLoggedUser: jasmine.createSpy('getLoggedUser').and.returnValue({
        email: 'client@banka.com',
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

  it('renders Bankarstvo group for client with BANKING_BASIC', () => {
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Bankarstvo');
    expect(html).toContain('Pocetna');
  });

  it('hides Berza and Administracija groups when user has only BANKING_BASIC', () => {
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

  it('shows Berza group for actuary with SECURITIES_TRADE permission', () => {
    authMock.getLoggedUser.and.returnValue({
      email: 'agent@banka.com',
      permissions: ['SECURITIES_TRADE'],
    });
    // Re-create da bi ngOnInit ponovo procitao permisije.
    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Berza');
    expect(html).not.toContain('Bankarstvo');
  });
});
