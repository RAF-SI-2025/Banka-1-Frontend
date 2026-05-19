import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FundService } from './fund.service';
import { environment } from '../../../../environments/environment';
import { FundStatistics, FundValueSnapshotPoint } from '../models/fund.model';

describe('FundService', () => {
  let service: FundService;
  let httpMock: HttpTestingController;

  const baseUrl = `${environment.apiUrl}/funds`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FundService],
    });

    service = TestBed.inject(FundService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('discovery', () => {
    it('should fetch the fund list without sort params by default', () => {
      service.discovery().subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('should pass sort and direction params when provided', () => {
      service.discovery('annualizedReturn', 'desc').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === baseUrl &&
          r.params.get('sort') === 'annualizedReturn' &&
          r.params.get('direction') === 'desc',
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should map the metric fields, defaulting missing ones to null', () => {
      let result: any;
      service.discovery().subscribe((funds) => (result = funds));

      const req = httpMock.expectOne(baseUrl);
      req.flush([
        { id: 1, naziv: 'A', annualizedReturn: 0.12, volatility: 0.05 },
        { id: 2, naziv: 'B' },
      ]);

      expect(result[0].annualizedReturn).toBe(0.12);
      expect(result[0].volatility).toBe(0.05);
      expect(result[0].rewardToVariability).toBeNull();
      expect(result[0].maxDrawdown).toBeNull();
      expect(result[1].annualizedReturn).toBeNull();
      expect(result[1].rewardToVariability).toBeNull();
      expect(result[1].maxDrawdown).toBeNull();
      expect(result[1].volatility).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should fetch the statistics for a fund', () => {
      const payload: FundStatistics = {
        metricsAvailable: true,
        annualizedReturn: 0.12,
        rewardToVariability: 1.4,
        maxDrawdown: -0.08,
        volatility: 0.06,
      };
      let result: FundStatistics | undefined;
      service.getStatistics(7).subscribe((s) => (result = s));

      const req = httpMock.expectOne(`${baseUrl}/7/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(payload);

      expect(result).toEqual(payload);
    });
  });

  describe('getValueHistory', () => {
    it('should fetch the value-history series for a fund', () => {
      const series: FundValueSnapshotPoint[] = [
        { snapshotDate: '2026-01-01', totalValue: 1000, profit: 0 },
        { snapshotDate: '2026-02-01', totalValue: 1100, profit: 100 },
      ];
      let result: FundValueSnapshotPoint[] | undefined;
      service.getValueHistory(7).subscribe((s) => (result = s));

      const req = httpMock.expectOne(`${baseUrl}/7/value-history`);
      expect(req.request.method).toBe('GET');
      req.flush(series);

      expect(result).toEqual(series);
    });

    it('should return an empty array when the body is null', () => {
      let result: FundValueSnapshotPoint[] | undefined;
      service.getValueHistory(7).subscribe((s) => (result = s));

      httpMock.expectOne(`${baseUrl}/7/value-history`).flush(null);

      expect(result).toEqual([]);
    });
  });

  describe('fundPerformance', () => {
    it('should be backed by the value-history endpoint', () => {
      let result: FundValueSnapshotPoint[] | undefined;
      service.fundPerformance(9).subscribe((s) => (result = s));

      const req = httpMock.expectOne(`${baseUrl}/9/value-history`);
      expect(req.request.method).toBe('GET');
      req.flush([{ snapshotDate: '2026-03-01', totalValue: 500, profit: 5 }]);

      expect(result?.length).toBe(1);
    });
  });

  describe('getAverageValueHistory', () => {
    it('should fetch the system-wide average series', () => {
      const series: FundValueSnapshotPoint[] = [
        { snapshotDate: '2026-01-01', totalValue: 900, profit: 0 },
      ];
      let result: FundValueSnapshotPoint[] | undefined;
      service.getAverageValueHistory().subscribe((s) => (result = s));

      const req = httpMock.expectOne(`${baseUrl}/value-history/average`);
      expect(req.request.method).toBe('GET');
      req.flush(series);

      expect(result).toEqual(series);
    });

    it('should return an empty array when the body is null', () => {
      let result: FundValueSnapshotPoint[] | undefined;
      service.getAverageValueHistory().subscribe((s) => (result = s));

      httpMock.expectOne(`${baseUrl}/value-history/average`).flush(null);

      expect(result).toEqual([]);
    });
  });
});
