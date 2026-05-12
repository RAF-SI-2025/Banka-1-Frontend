import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AccountListComponent } from './account-list.component';
import { AccountService } from '../../services/account.service';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', [
      'getMyAccounts',
      'getTransactions'
    ]);
    accountServiceSpy.getMyAccounts.and.returnValue(of([]));
    accountServiceSpy.getTransactions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      // PR_31 follow-up: AccountListComponent je standalone — ide u imports, ne u declarations.
      imports: [AccountListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AccountService, useValue: accountServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getMyAccounts on init', () => {
    expect(accountServiceSpy.getMyAccounts).toHaveBeenCalled();
  });

  it('maskAccountNumber should mask all but last 4 digits', () => {
    expect(component.maskAccountNumber('265000000001111111')).toBe('**** 1111');
  });

  it('maskAccountNumber should return short input unchanged', () => {
    expect(component.maskAccountNumber('12')).toBe('12');
  });
});
