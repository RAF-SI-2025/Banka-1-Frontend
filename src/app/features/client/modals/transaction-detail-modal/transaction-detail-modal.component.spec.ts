import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetailModalComponent } from './transaction-detail-modal.component';

describe('TransactionDetailModalComponent', () => {
  let component: TransactionDetailModalComponent;
  let fixture: ComponentFixture<TransactionDetailModalComponent>;

  beforeEach(async () => {
    // PR_31 follow-up: TransactionDetailModalComponent je standalone — mora ici u imports.
    await TestBed.configureTestingModule({
      imports: [TransactionDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
