import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { RecurringOrderService } from './recurring-order.service';
import { RecurringOrder } from '../models/recurring-order.model';

const baseUrl = `${environment.apiUrl}/recurring-orders`;

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

describe('RecurringOrderService', () => {
  let service: RecurringOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecurringOrderService],
    });
    service = TestBed.inject(RecurringOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getRecurringOrders GETs /recurring-orders', () => {
    let result: RecurringOrder[] | undefined;
    service.getRecurringOrders().subscribe((r) => (result = r));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    const body = [recurringOrder(1), recurringOrder(2)];
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('createRecurringOrder POSTs the full request body', () => {
    let result: RecurringOrder | undefined;
    service
      .createRecurringOrder({
        listingId: 555,
        direction: 'SELL',
        mode: 'BY_QUANTITY',
        value: 3,
        accountId: 8001,
        cadence: 'WEEKLY',
        nextRun: '2026-06-01',
      })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      listingId: 555,
      direction: 'SELL',
      mode: 'BY_QUANTITY',
      value: 3,
      accountId: 8001,
      cadence: 'WEEKLY',
      nextRun: '2026-06-01',
    });
    req.flush(recurringOrder(9));
    expect(result).toEqual(recurringOrder(9));
  });

  it('pause PATCHes /recurring-orders/{id}/pause', () => {
    service.pause(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7/pause`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(recurringOrder(7, { active: false }));
  });

  it('resume PATCHes /recurring-orders/{id}/resume', () => {
    service.resume(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7/resume`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(recurringOrder(7, { active: true }));
  });

  it('deleteRecurringOrder DELETEs /recurring-orders/{id}', () => {
    service.deleteRecurringOrder(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
