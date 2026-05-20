import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PortfolioService } from './portfolio.service';
import { environment } from '../../../../environments/environment';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/order/portfolio`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PortfolioService],
    });

    service = TestBed.inject(PortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch portfolio summary', () => {
    service.getPortfolio().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      holdings: [],
      totalProfit: 0,
      yearlyTaxPaid: 0,
      monthlyTaxDue: 0,
    });
  });

  it('should send public quantity update', () => {
    service.setPublicQuantity(15, { publicQuantity: 3 }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/15/set-public`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ publicQuantity: 3 });
    req.flush(null);
  });

  it('should send exercise option request', () => {
    service.exerciseOption(22).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/22/exercise-option`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('should fetch dividend history for a holding', () => {
    let result: unknown;
    service.getDividendHistory(11).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${baseUrl}/11/dividends`);
    expect(req.request.method).toBe('GET');
    req.flush({
      totalReceived: 125.5,
      currency: 'USD',
      payouts: [
        { payoutDate: '2026-03-15', amount: 50, currency: 'USD' },
        { payoutDate: '2025-12-10', amount: 75.5, currency: 'USD' },
      ],
    });

    expect(result).toEqual({
      totalReceived: 125.5,
      currency: 'USD',
      payouts: jasmine.any(Array),
    });
  });
});
