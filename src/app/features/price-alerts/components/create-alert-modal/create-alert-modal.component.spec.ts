import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CreateAlertModalComponent } from './create-alert-modal.component';
import { AlertService } from '../../services/alert.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PriceAlert } from '../../models/price-alert.model';

function alert(id: number): PriceAlert {
  return {
    id,
    listingId: 100 + id,
    ticker: `TKR${id}`,
    securityName: `Security ${id}`,
    condition: 'ABOVE',
    threshold: 150,
    notificationType: 'IN_APP',
    active: true,
    createdAt: '2026-05-01T10:00:00Z',
  };
}

describe('CreateAlertModalComponent', () => {
  let fixture: ComponentFixture<CreateAlertModalComponent>;
  let component: CreateAlertModalComponent;
  let service: jasmine.SpyObj<AlertService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('AlertService', ['createAlert']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [CreateAlertModalComponent],
      providers: [
        { provide: AlertService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAlertModalComponent);
    component = fixture.componentInstance;
    component.listingId = 777;
    component.ticker = 'AAPL';
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('isPercent is true only for the intraday-drop condition', () => {
    component.condition = 'ABOVE';
    expect(component.isPercent).toBeFalse();
    component.condition = 'PCT_DROP_INTRADAY';
    expect(component.isPercent).toBeTrue();
  });

  it('submit rejects a missing / non-positive threshold', () => {
    fixture.detectChanges();
    component.threshold = null;
    component.submit();
    expect(service.createAlert).not.toHaveBeenCalled();
    expect(component.error).toBeTruthy();

    component.threshold = 0;
    component.submit();
    expect(service.createAlert).not.toHaveBeenCalled();
  });

  it('submit posts the full request and emits created on success', () => {
    service.createAlert.and.returnValue(of(alert(9)));
    fixture.detectChanges();

    const createdSpy = jasmine.createSpy('created');
    const closeSpy = jasmine.createSpy('close');
    component.created.subscribe(createdSpy);
    component.close.subscribe(closeSpy);

    component.condition = 'BELOW';
    component.threshold = 120;
    component.notificationType = 'ALL';
    component.submit();

    expect(service.createAlert).toHaveBeenCalledWith({
      listingId: 777,
      condition: 'BELOW',
      threshold: 120,
      notificationType: 'ALL',
    });
    expect(toast.success).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('submit surfaces an error and keeps the modal open on failure', () => {
    service.createAlert.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    component.threshold = 100;
    component.submit();
    expect(component.error).toBe('Greska pri postavljanju obavestenja.');
    expect(component.submitting).toBeFalse();
  });
});
