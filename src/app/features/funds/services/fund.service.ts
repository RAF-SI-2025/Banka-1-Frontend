import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
  BankInvestRequest,
  BankRedeemRequest,
  ClientFundPosition,
  ClientFundTransaction,
  FundHolding,
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

  getFundHistory(fundId: number, period: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${fundId}/history`, {
      params: { period }
    });
  }

  discovery(): Observable<InvestmentFund[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map((funds) => (funds ?? []).map((fund) => this.mapFund(fund))),
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
    } as InvestmentFund;
  }

  private normalizeAccountId(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }
}