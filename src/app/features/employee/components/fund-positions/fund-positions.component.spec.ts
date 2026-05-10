import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundPositionsComponent } from './fund-positions.component';

describe('FundPositionsComponent', () => {
  let component: FundPositionsComponent;
  let fixture: ComponentFixture<FundPositionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FundPositionsComponent]
    });
    fixture = TestBed.createComponent(FundPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
