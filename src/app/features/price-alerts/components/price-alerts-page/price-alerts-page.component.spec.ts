import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { PriceAlertsPageComponent } from './price-alerts-page.component';
import { AlertService } from '../../services/alert.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PriceAlert } from '../../models/price-alert.model';

function alert(id: number, overrides: Partial<PriceAlert> = {}): PriceAlert {
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
    ...overrides,
  };
}

describe('PriceAlertsPageComponent', () => {
  let fixture: ComponentFixture<PriceAlertsPageComponent>;
  let component: PriceAlertsPageComponent;
  let service: jasmine.SpyObj<AlertService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('AlertService', [
      'getAlerts',
      'toggleActive',
      'deleteAlert',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    service.getAlerts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PriceAlertsPageComponent, RouterTestingModule],
      providers: [
        { provide: AlertService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceAlertsPageComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads alerts on init', () => {
    service.getAlerts.and.returnValue(of([alert(1), alert(2)]));
    fixture.detectChanges();
    expect(component.alerts.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('shows an error when alerts fail to load', () => {
    service.getAlerts.and.returnValue(throwError(() => new Error('down')));
    fixture.detectChanges();
    expect(component.error).toBe('Greska pri ucitavanju obavestenja.');
  });

  it('toggle flips the active flag locally on success', () => {
    service.getAlerts.and.returnValue(of([alert(1, { active: true })]));
    service.toggleActive.and.returnValue(of(alert(1, { active: false })));
    fixture.detectChanges();

    const a = component.alerts[0];
    component.toggle(a);
    expect(service.toggleActive).toHaveBeenCalledWith(1, false);
    expect(a.active).toBeFalse();
    expect(toast.success).toHaveBeenCalled();
  });

  it('toggle surfaces an error toast on failure', () => {
    service.getAlerts.and.returnValue(of([alert(1, { active: true })]));
    service.toggleActive.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    component.toggle(component.alerts[0]);
    expect(toast.error).toHaveBeenCalled();
    /* The optimistic flip must be left intact only on success. */
    expect(component.alerts[0].active).toBeTrue();
  });

  it('conditionLabel and channelLabel return Serbian labels', () => {
    expect(component.conditionLabel('ABOVE')).toBe('Cena iznad');
    expect(component.conditionLabel('PCT_DROP_INTRADAY')).toBe('Intradnevni pad');
    expect(component.channelLabel('ALL')).toBe('Svi kanali');
  });

  it('isPercent is true only for the intraday-drop condition', () => {
    expect(component.isPercent('PCT_DROP_INTRADAY')).toBeTrue();
    expect(component.isPercent('ABOVE')).toBeFalse();
  });
});
