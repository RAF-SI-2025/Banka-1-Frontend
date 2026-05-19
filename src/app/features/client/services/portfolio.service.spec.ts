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

  // WP-24: dividend payout history.
  it('should fetch all dividend payouts when no listingId is given', () => {
    service.getDividends().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/dividends`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('listingId')).toBeFalse();
    req.flush([]);
  });

  it('should fetch dividend payouts filtered by listingId', () => {
    service.getDividends(101).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/dividends` && r.params.get('listingId') === '101',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
