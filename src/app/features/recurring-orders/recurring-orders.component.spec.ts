import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { RecurringOrdersComponent } from './recurring-orders.component';
import { RecurringOrderService } from './services/recurring-order.service';
import { ToastService } from '../../shared/services/toast.service';
import { RecurringOrder } from './models/recurring-order.model';

function recurringOrder(
  id: number,
  overrides: Partial<RecurringOrder> = {},
): RecurringOrder {
  return {
    id,
    listingId: 100 + id,
    direction: 'BUY',
    mode: 'BY_AMOUNT',
    value: 500,
    accountId: 9000 + id,
    cadence: 'MONTHLY',
    nextRun: '2026-06-01T08:00:00Z',
    active: true,
    createdAt: '2026-05-01T10:00:00Z',
    ...overrides,
  };
}

describe('RecurringOrdersComponent', () => {
  let fixture: ComponentFixture<RecurringOrdersComponent>;
  let component: RecurringOrdersComponent;
  let service: jasmine.SpyObj<RecurringOrderService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('RecurringOrderService', [
      'getRecurringOrders',
      'createRecurringOrder',
      'pause',
      'resume',
      'deleteRecurringOrder',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    service.getRecurringOrders.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RecurringOrdersComponent],
      providers: [
        { provide: RecurringOrderService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringOrdersComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads recurring orders on init', () => {
    service.getRecurringOrders.and.returnValue(
      of([recurringOrder(1), recurringOrder(2)]),
    );
    fixture.detectChanges();
    expect(component.orders.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('shows an error when orders fail to load', () => {
    service.getRecurringOrders.and.returnValue(
      throwError(() => new Error('down')),
    );
    fixture.detectChanges();
    expect(component.error).toBe('Greska pri ucitavanju trajnih naloga.');
    expect(component.isLoading).toBeFalse();
  });

  it('openModal resets the form and opens the modal', () => {
    fixture.detectChanges();
    component.listingId = 99;
    component.value = 1000;
    component.openModal();
    expect(component.modalOpen).toBeTrue();
    expect(component.listingId).toBeNull();
    expect(component.value).toBeNull();
    expect(component.formError).toBeNull();
  });

  it('isByAmount tracks the sizing mode', () => {
    component.mode = 'BY_AMOUNT';
    expect(component.isByAmount).toBeTrue();
    component.mode = 'BY_QUANTITY';
    expect(component.isByAmount).toBeFalse();
  });

  it('submit rejects an incomplete form without calling the service', () => {
    fixture.detectChanges();
    component.openModal();
    /* listingId still null */
    component.submit();
    expect(service.createRecurringOrder).not.toHaveBeenCalled();
    expect(component.formError).toBeTruthy();

    /* listingId set, value still null */
    component.listingId = 101;
    component.submit();
    expect(service.createRecurringOrder).not.toHaveBeenCalled();

    /* value set, accountId still null */
    component.value = 500;
    component.submit();
    expect(service.createRecurringOrder).not.toHaveBeenCalled();

    /* accountId set, nextRun still empty */
    component.accountId = 9001;
    component.submit();
    expect(service.createRecurringOrder).not.toHaveBeenCalled();
  });

  it('submit posts the full request and reloads on success', () => {
    service.createRecurringOrder.and.returnValue(of(recurringOrder(9)));
    service.getRecurringOrders.and.returnValue(of([recurringOrder(9)]));
    fixture.detectChanges();

    component.openModal();
    component.listingId = 101;
    component.direction = 'SELL';
    component.mode = 'BY_QUANTITY';
    component.value = 4;
    component.accountId = 9001;
    component.cadence = 'WEEKLY';
    component.nextRun = '2026-06-01';
    component.submit();

    expect(service.createRecurringOrder).toHaveBeenCalledWith({
      listingId: 101,
      direction: 'SELL',
      mode: 'BY_QUANTITY',
      value: 4,
      accountId: 9001,
      cadence: 'WEEKLY',
      nextRun: '2026-06-01',
    });
    expect(component.modalOpen).toBeFalse();
    expect(toast.success).toHaveBeenCalled();
  });

  it('submit surfaces an error and keeps the modal open on failure', () => {
    service.createRecurringOrder.and.returnValue(
      throwError(() => new Error('boom')),
    );
    fixture.detectChanges();

    component.openModal();
    component.listingId = 101;
    component.value = 500;
    component.accountId = 9001;
    component.nextRun = '2026-06-01';
    component.submit();

    expect(component.formError).toBe('Greska pri kreiranju trajnog naloga.');
    expect(component.submitting).toBeFalse();
    expect(component.modalOpen).toBeTrue();
  });

  it('pause flips an active order to paused on success', () => {
    service.getRecurringOrders.and.returnValue(
      of([recurringOrder(1, { active: true })]),
    );
    service.pause.and.returnValue(of(recurringOrder(1, { active: false })));
    fixture.detectChanges();

    const o = component.orders[0];
    component.pause(o);
    expect(service.pause).toHaveBeenCalledWith(1);
    expect(o.active).toBeFalse();
    expect(toast.success).toHaveBeenCalled();
  });

  it('pause surfaces an error toast and leaves the order active on failure', () => {
    service.getRecurringOrders.and.returnValue(
      of([recurringOrder(1, { active: true })]),
    );
    service.pause.and.returnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    component.pause(component.orders[0]);
    expect(toast.error).toHaveBeenCalled();
    expect(component.orders[0].active).toBeTrue();
  });

  it('resume flips a paused order to active on success', () => {
    service.getRecurringOrders.and.returnValue(
      of([recurringOrder(1, { active: false })]),
    );
    service.resume.and.returnValue(of(recurringOrder(1, { active: true })));
    fixture.detectChanges();

    const o = component.orders[0];
    component.resume(o);
    expect(service.resume).toHaveBeenCalledWith(1);
    expect(o.active).toBeTrue();
    expect(toast.success).toHaveBeenCalled();
  });

  it('cancel deletes and reloads when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    service.getRecurringOrders.and.returnValue(of([recurringOrder(1)]));
    service.deleteRecurringOrder.and.returnValue(of(void 0));
    fixture.detectChanges();

    component.cancel(component.orders[0]);
    expect(service.deleteRecurringOrder).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
  });

  it('cancel does nothing when the confirm dialog is dismissed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    service.getRecurringOrders.and.returnValue(of([recurringOrder(1)]));
    fixture.detectChanges();

    component.cancel(component.orders[0]);
    expect(service.deleteRecurringOrder).not.toHaveBeenCalled();
  });

  it('label helpers return Serbian text', () => {
    expect(component.directionLabel('BUY')).toBe('Kupovina');
    expect(component.directionLabel('SELL')).toBe('Prodaja');
    expect(component.modeLabel('BY_AMOUNT')).toBe('Po iznosu');
    expect(component.modeLabel('BY_QUANTITY')).toBe('Po kolicini');
    expect(component.cadenceLabel('DAILY')).toBe('Dnevno');
    expect(component.cadenceLabel('MONTHLY')).toBe('Mesecno');
  });
});
