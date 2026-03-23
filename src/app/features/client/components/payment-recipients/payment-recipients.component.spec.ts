import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentRecipientsComponent } from './payment-recipients.component';

describe('PaymentRecipientsComponent', () => {
  let component: PaymentRecipientsComponent;
  let fixture: ComponentFixture<PaymentRecipientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentRecipientsComponent]
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
