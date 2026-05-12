import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AccountDetailsModalComponent } from './account-details-modal.component';

describe('AccountDetailsModalComponent', () => {
  let component: AccountDetailsModalComponent;
  let fixture: ComponentFixture<AccountDetailsModalComponent>;

  beforeEach(async () => {
    // PR_31 follow-up: AccountDetailsModalComponent je standalone — mora ici u imports.
    // Koristi AccountService (HttpClient) pa zovemo HttpClientTestingModule.
    await TestBed.configureTestingModule({
      imports: [AccountDetailsModalComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
