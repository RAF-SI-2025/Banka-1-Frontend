import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PaymentRecipientsComponent } from './payment-recipients.component';

describe('PaymentRecipientsComponent', () => {
  let component: PaymentRecipientsComponent;
  let fixture: ComponentFixture<PaymentRecipientsComponent>;

  beforeEach(async () => {
    // PR_31 follow-up: standalone komponenta koja koristi ClientService (HttpClient).
    await TestBed.configureTestingModule({
      imports: [PaymentRecipientsComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentRecipientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
