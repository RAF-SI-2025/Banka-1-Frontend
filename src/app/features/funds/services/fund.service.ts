import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
  BankInvestRequest,
  BankRedeemRequest,
  ClientFundPosition,
  ClientFundTransaction,
  FundHolding,
  FundStatistics,
  FundValueSnapshotPoint,
  InvestmentFund,
  InvestmentRequest,
  RedemptionRequest,
  SellResult,
} from '../models/fund.model';

export interface CreateFundRequest {
  naziv: string;
  opis?: string;
  minimumContribution: number;
}

@Injectable({ providedIn: 'root' })
export class FundService {
  private readonly baseUrl = `${environment.apiUrl}/funds`;

  constructor(private http: HttpClient) {}

  /**
   * WP-26: discovery lista. `sort`/`direction` su opcioni — backend prihvata
   * postojeca polja plus 4 metric naziva (annualizedReturn, rewardToVariability,
   * maxDrawdown, volatility). Komponenta i dalje sortira klijent-side, ali
   * parametri se prosledjuju kad se eksplicitno zatraze.
   */
  discovery(sort?: string, direction?: 'asc' | 'desc'): Observable<InvestmentFund[]> {
    let params = new HttpParams();
    if (sort) {
      params = params.set('sort', sort);
    }
    if (direction) {
      params = params.set('direction', direction);
    }
    return this.http.get<any[]>(this.baseUrl, { params }).pipe(
      map((funds) => (funds ?? []).map((fund) => this.mapFund(fund))),
    );
  }

  /** WP-26: performance metrike fonda (`GET /funds/{id}/statistics`). */
  getStatistics(fundId: number): Observable<FundStatistics> {
    return this.http.get<FundStatistics>(`${this.baseUrl}/${fundId}/statistics`);
  }

  /** WP-26: realna istorija vrednosti fonda (`FundValueSnapshot` serija, rastuca po datumu). */
  getValueHistory(fundId: number): Observable<FundValueSnapshotPoint[]> {
    return this.http.get<FundValueSnapshotPoint[]>(`${this.baseUrl}/${fundId}/value-history`).pipe(
      map((points) => points ?? []),
    );
  }

  /**
   * WP-26: alias za `getValueHistory` — implementation plan referencira
   * `fundPerformance()` koji je nedostajao u servisu. Backed je realnim
   * `/funds/{id}/value-history` endpoint-om.
   */
  fundPerformance(fundId: number): Observable<FundValueSnapshotPoint[]> {
    return this.getValueHistory(fundId);
  }

  /** WP-26: sistemski prosek snapshot serije preko svih fondova (za comparison chart). */
  getAverageValueHistory(): Observable<FundValueSnapshotPoint[]> {
    return this.http.get<FundValueSnapshotPoint[]>(`${this.baseUrl}/value-history/average`).pipe(
      map((points) => points ?? []),
    );
  }

  details(fundId: number): Observable<InvestmentFund> {
    return this.http.get<any>(`${this.baseUrl}/${fundId}`).pipe(
      map((fund) => this.mapFund(fund)),
    );
  }

  createFund(req: CreateFundRequest): Observable<InvestmentFund> {
    return this.http.post<any>(this.baseUrl, req).pipe(
      map((fund) => this.mapFund(fund)),
    );
  }

  supervised(): Observable<InvestmentFund[]> {
    return this.http.get<any[]>(`${this.baseUrl}/supervised`).pipe(
      map((funds) => (funds ?? []).map((fund) => this.mapFund(fund))),
    );
  }

  // Client endpoints

  invest(fundId: number, req: InvestmentRequest): Observable<ClientFundTransaction> {
    return this.http.post<ClientFundTransaction>(`${this.baseUrl}/${fundId}/invest`, req);
  }

  redeem(fundId: number, req: RedemptionRequest): Observable<ClientFundTransaction> {
    return this.http.post<ClientFundTransaction>(`${this.baseUrl}/${fundId}/redeem`, req);
  }

  myPositions(): Observable<ClientFundPosition[]> {
    return this.http.get<ClientFundPosition[]>(`${this.baseUrl}/my-positions`);
  }

  myTransactions(): Observable<ClientFundTransaction[]> {
    return this.http.get<ClientFundTransaction[]>(`${this.baseUrl}/my-transactions`);
  }

  // Supervisor endpoints

  bankInvest(fundId: number, req: BankInvestRequest): Observable<ClientFundTransaction> {
    return this.http.post<ClientFundTransaction>(`${this.baseUrl}/${fundId}/bank-invest`, req);
  }

  bankRedeem(fundId: number, req: BankRedeemRequest): Observable<ClientFundTransaction> {
    return this.http.post<ClientFundTransaction>(`${this.baseUrl}/${fundId}/bank-redeem`, req);
  }

  bankPositions(): Observable<ClientFundPosition[]> {
    return this.http.get<ClientFundPosition[]>(`${this.baseUrl}/bank-positions`);
  }

  fundPositions(fundId: number): Observable<ClientFundPosition[]> {
    return this.http.get<ClientFundPosition[]>(`${this.baseUrl}/${fundId}/positions`);
  }

  fundSecurities(fundId: number): Observable<FundHolding[]> {
    return this.http.get<FundHolding[]>(`${this.baseUrl}/${fundId}/securities`);
  }

  sellSecurity(fundId: number, ticker: string, quantity: number): Observable<SellResult> {
    return this.http.post<SellResult>(`${this.baseUrl}/${fundId}/securities/${ticker}/sell`, { quantity });
  }

  fundTransactions(fundId: number): Observable<ClientFundTransaction[]> {
    return this.http.get<ClientFundTransaction[]>(`${this.baseUrl}/${fundId}/transactions`);
  }

  private mapFund(fund: any): InvestmentFund {
    return {
      ...fund,
      accountId: this.normalizeAccountId(
        fund.accountId ??
        fund.accountID ??
        fund.account_id ??
        fund.account?.id ??
        fund.account?.accountId ??
        fund.account?.accountID ??
        fund.account?.account_id,
      ),
      accountNumber: fund.accountNumber ?? fund.account?.accountNumber ?? fund.account?.brojRacuna,
      // WP-26: metrike su nullable na backend-u (null kad fond nema dovoljno
      // snapshot-ova). Normalizujemo `undefined` -> `null` da template uvek
      // ima determinisanu vrednost za "Nedovoljno podataka" placeholder.
      annualizedReturn: this.normalizeMetric(fund.annualizedReturn),
      rewardToVariability: this.normalizeMetric(fund.rewardToVariability),
      maxDrawdown: this.normalizeMetric(fund.maxDrawdown),
      volatility: this.normalizeMetric(fund.volatility),
    } as InvestmentFund;
  }

  private normalizeMetric(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private normalizeAccountId(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }
}
