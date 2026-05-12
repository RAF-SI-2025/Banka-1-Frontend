import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TaxTrackingComponent } from './tax-tracking.component';

describe('TaxTrackingComponent', () => {
  let component: TaxTrackingComponent;
  let fixture: ComponentFixture<TaxTrackingComponent>;

  beforeEach(async () => {
    // PR_31 follow-up: standalone komponenta koja koristi TaxService (HttpClient).
    await TestBed.configureTestingModule({
      imports: [TaxTrackingComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
