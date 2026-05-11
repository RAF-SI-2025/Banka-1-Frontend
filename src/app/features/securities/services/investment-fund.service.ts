import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  InvestmentFundDetail,
  FundPerformancePeriod,
  FundPerformancePoint,
} from '../models/investment-fund.model';

@Injectable({ providedIn: 'root' })
export class InvestmentFundService {
  private readonly baseUrl = `${environment.apiUrl}/stock/investment-funds`;

  constructor(private readonly http: HttpClient) {}

  getFundDetail(fundId: number): Observable<InvestmentFundDetail> {
    return this.http
      .get<InvestmentFundDetail>(`${this.baseUrl}/${fundId}`)
      .pipe(catchError(() => of(this.getMockFund(fundId))));
  }

  getFundPerformance(
    fundId: number,
    period: FundPerformancePeriod,
  ): Observable<FundPerformancePoint[]> {
    return this.http
      .get<FundPerformancePoint[]>(`${this.baseUrl}/${fundId}/performance`, {
        params: { period },
      })
      .pipe(catchError(() => of(this.getMockFund(fundId).performance[period])));
  }

  sellFundSecurity(fundId: number, securityHoldingId: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${fundId}/securities/${securityHoldingId}/sell`,
      {},
    );
  }

  private getMockFund(fundId: number): InvestmentFundDetail {
    return {
      id: fundId,
      name: 'Alpha Growth Fund',
      description: 'Fond fokusiran na tehnološki sektor i likvidne akcije sa stabilnim rastom.',
      managerName: 'Marko Matic',
      fundValue: 2600000,
      minimumContribution: 1000,
      profit: 500000,
      accountNumber: '123-45678-90',
      liquidity: 1500000,
      securities: [
        {
          id: 1,
          ticker: 'AAPL',
          price: 174.5,
          change: 2.5,
          volume: 50000000,
          initialMarginCost: 15000,
          acquisitionDate: '2024-03-15',
        },
        {
          id: 2,
          ticker: 'MSFT',
          price: 380.5,
          change: -1.2,
          volume: 25000000,
          initialMarginCost: 30000,
          acquisitionDate: '2024-04-02',
        },
        {
          id: 3,
          ticker: 'NVDA',
          price: 875.2,
          change: 5.4,
          volume: 40000000,
          initialMarginCost: 70000,
          acquisitionDate: '2024-05-10',
        },
      ],
      performance: {
        monthly: [
          { date: '2026-01-31', value: 2140000, profit: 240000 },
          { date: '2026-02-28', value: 2210000, profit: 300000 },
          { date: '2026-03-31', value: 2360000, profit: 380000 },
          { date: '2026-04-30', value: 2490000, profit: 450000 },
          { date: '2026-05-31', value: 2600000, profit: 500000 },
        ],
        quarterly: [
          { date: '2025-06-30', value: 1820000, profit: 120000 },
          { date: '2025-09-30', value: 1980000, profit: 190000 },
          { date: '2025-12-31', value: 2140000, profit: 240000 },
          { date: '2026-03-31', value: 2360000, profit: 380000 },
        ],
        yearly: [
          { date: '2023-12-31', value: 1500000, profit: 0 },
          { date: '2024-12-31', value: 1810000, profit: 160000 },
          { date: '2025-12-31', value: 2140000, profit: 240000 },
          { date: '2026-12-31', value: 2600000, profit: 500000 },
        ],
      },
    };
  }
}
