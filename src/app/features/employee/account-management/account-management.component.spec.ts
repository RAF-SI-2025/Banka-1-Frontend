import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AccountManagementComponent } from './account-management.component';
import { AccountService } from '../../client/services/account.service';
import { ToastService } from '../../../shared/services/toast.service';

// PR_31 phase 1: aligned with current AccountManagementComponent
// (standalone component, paginated `getAllAccountsPaginated`, `allAccounts`/`searchQuery`/`onSearch`).
const pagedResponse = {
  content: [
    {
      brojRacuna: '265000000001111111',
      stanje: 1000,
      raspolozivoStanje: 900,
      rezervisanaSredstva: 100,
      currency: 'RSD',
      status: 'ACTIVE',
      accountOwnershipType: 'PERSONAL',
      tekuciIliDevizni: 'tekuci',
      vlasnik: 1,
      ime: 'Jovan',
      prezime: 'Jovanovic',
      zaposlen: 1,
      dnevniLimit: 100000,
      mesecniLimit: 500000,
      dnevnaPotrosnja: 0,
      mesecnaPotrosnja: 0,
      datumIVremeKreiranja: '2024-01-01T00:00:00',
      datumIsteka: '2034-01-01T00:00:00',
      isSystemAccount: false,
    },
  ],
  totalPages: 1,
};

describe('AccountManagementComponent', () => {
  let component: AccountManagementComponent;
  let fixture: ComponentFixture<AccountManagementComponent>;

  beforeEach(() => {
    const accountServiceStub = {
      getAllAccountsPaginated: () => of(pagedResponse),
      updateAccountStatus: () => of(void 0),
    };
    const toastServiceStub = {
      success: () => {},
      error: () => {},
    };

    TestBed.configureTestingModule({
      imports: [
        AccountManagementComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: AccountService, useValue: accountServiceStub },
        { provide: ToastService, useValue: toastServiceStub },
      ],
    });

    fixture = TestBed.createComponent(AccountManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and filter accounts via owner search', () => {
    expect(component.allAccounts.length).toBe(1);
    expect(component.filteredAccounts.length).toBe(1);

    component.searchQuery = 'nepostojece';
    component.onSearch();
    expect(component.filteredAccounts.length).toBe(0);
  });

  it('should reset filter when search query is cleared', () => {
    component.searchQuery = 'nepostojece';
    component.onSearch();
    expect(component.filteredAccounts.length).toBe(0);

    component.searchQuery = '';
    component.onSearch();
    expect(component.filteredAccounts.length).toBe(1);
  });
});
