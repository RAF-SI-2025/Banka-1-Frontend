import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RenameAccountComponent } from './rename-account.component';
import { Account } from '../../models/account.model';

describe('RenameAccountComponent', () => {
  let component: RenameAccountComponent;
  let fixture: ComponentFixture<RenameAccountComponent>;

  beforeEach(async () => {
    // PR_31 follow-up: standalone komponenta, koristi AccountService (HttpClient) i ToastService.
    // HttpClientTestingModule zadovoljava DI; ToastService je providedIn:'root' pa ne treba override.
    await TestBed.configureTestingModule({
      imports: [RenameAccountComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(RenameAccountComponent);
    component = fixture.componentInstance;
    component.account = {
      id: 1,
      accountNumber: '265000000001111111',
      name: 'Test',
      subtype: 'STANDARD',
      availableBalance: 1000,
      status: 'ACTIVE'
    } as Account;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
