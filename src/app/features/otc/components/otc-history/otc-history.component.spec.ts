import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtcHistoryComponent } from './otc-history.component';

describe('OtcHistoryComponent', () => {
  let component: OtcHistoryComponent;
  let fixture: ComponentFixture<OtcHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OtcHistoryComponent]
    });
    fixture = TestBed.createComponent(OtcHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
