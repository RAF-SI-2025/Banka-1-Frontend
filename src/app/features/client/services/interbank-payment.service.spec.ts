import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { InterbankPaymentService, InterbankPaymentRequest } from './interbank-payment.service';
import { environment } from 'src/environments/environment';

describe('InterbankPaymentService', () => {
  let service: InterbankPaymentService;
  let httpMock: HttpTestingController;

  const endpoint = `${environment.apiUrl}/api/interbank/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InterbankPaymentService],
    });
    service = TestBed.inject(InterbankPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('routingOf() vraca prve 3 cifre racuna', () => {
    expect(service.routingOf('2220001234567890123')).toBe('222');
    expect(service.routingOf('111')).toBe('111');
    expect(service.routingOf('22')).toBe('');
    expect(service.routingOf('')).toBe('');
    expect(service.routingOf(null)).toBe('');
  });

  it('isForeignAccount(): 111 je intra-bank (false), ostalo je cross-bank (true)', () => {
    expect(service.isForeignAccount('1110001234567890123')).toBeFalse();
    expect(service.isForeignAccount('2220001234567890123')).toBeTrue();
    expect(service.isForeignAccount('3330001234567890123')).toBeTrue();
    // Nepotpun racun nije validan cross-bank
    expect(service.isForeignAccount('22')).toBeFalse();
    expect(service.isForeignAccount('')).toBeFalse();
  });

  it('sendInterbankPayment() POST-uje na /api/interbank/payments sa korektnim telom', () => {
    const request: InterbankPaymentRequest = {
      fromAccount: '1110001234567890123',
      toAccount: '2220001234567890123',
      amount: '1500.00',
      currency: 'RSD',
      message: 'Test placanje',
    };

    let result: { transactionId: string; status: string } | undefined;
    service.sendInterbankPayment(request).subscribe((res) => (result = res));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);

    req.flush({ transactionId: 'TX-1', status: 'COMPLETED' });
    expect(result).toEqual({ transactionId: 'TX-1', status: 'COMPLETED' });
  });
});
