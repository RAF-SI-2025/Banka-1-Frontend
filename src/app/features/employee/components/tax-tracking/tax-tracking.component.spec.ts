import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaxTrackingComponent } from './tax-tracking.component';

describe('TaxTrackingComponent', () => {
  let component: TaxTrackingComponent;
  let fixture: ComponentFixture<TaxTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxTrackingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    (expect(component) as any).toBeTruthy();
  });
});