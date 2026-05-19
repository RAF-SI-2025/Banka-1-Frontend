import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { MyOrderService } from './my-order.service';
import { MyOrderPage } from '../models/my-order.model';

const baseUrl = `${environment.apiUrl}/orders/my-orders`;

function emptyPage(): MyOrderPage {
  return {
    content: [],
    page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
  };
}

describe('MyOrderService', () => {
  let service: MyOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyOrderService],
    });
    service = TestBed.inject(MyOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GETs /orders/my-orders with default page/size and no filter params', () => {
    let result: MyOrderPage | undefined;
    service.getMyOrders().subscribe((p) => (result = p));

    const req = httpMock.expectOne((r) => r.url === baseUrl && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('direction')).toBeFalse();
    expect(req.request.params.has('securityType')).toBeFalse();

    const body = emptyPage();
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('passes page and size through', () => {
    service.getMyOrders({}, 3, 25).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('size')).toBe('25');
    req.flush(emptyPage());
  });

  it('serializes status / direction / securityType / from / to filters', () => {
    service
      .getMyOrders(
        {
          status: 'DONE',
          direction: 'BUY',
          securityType: 'STOCK',
          from: '2026-01-01',
          to: '2026-05-19',
        },
        0,
        10,
      )
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('status')).toBe('DONE');
    expect(req.request.params.get('direction')).toBe('BUY');
    expect(req.request.params.get('securityType')).toBe('STOCK');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-05-19');
    req.flush(emptyPage());
  });

  it('omits filter params whose value is empty / undefined', () => {
    service
      .getMyOrders({ status: undefined, direction: 'SELL', securityType: '' }, 0, 10)
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('securityType')).toBeFalse();
    expect(req.request.params.get('direction')).toBe('SELL');
    req.flush(emptyPage());
  });
});
