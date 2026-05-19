import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from '../../../../environments/environment';
import { AlertService } from './alert.service';
import { PriceAlert } from '../models/price-alert.model';

const baseUrl = `${environment.apiUrl}/price-alerts`;

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

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlertService],
    });
    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAlerts GETs /price-alerts', () => {
    let result: PriceAlert[] | undefined;
    service.getAlerts().subscribe((a) => (result = a));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    const body = [alert(1), alert(2)];
    req.flush(body);
    expect(result).toEqual(body);
  });

  it('createAlert POSTs the full request body', () => {
    let result: PriceAlert | undefined;
    service
      .createAlert({
        listingId: 555,
        condition: 'BELOW',
        threshold: 90,
        notificationType: 'ALL',
      })
      .subscribe((a) => (result = a));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      listingId: 555,
      condition: 'BELOW',
      threshold: 90,
      notificationType: 'ALL',
    });
    req.flush(alert(9));
    expect(result).toEqual(alert(9));
  });

  it('toggleActive PATCHes /price-alerts/{id} with the active flag', () => {
    service.toggleActive(7, false).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ active: false });
    req.flush(alert(7, { active: false }));
  });

  it('deleteAlert DELETEs /price-alerts/{id}', () => {
    service.deleteAlert(7).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
