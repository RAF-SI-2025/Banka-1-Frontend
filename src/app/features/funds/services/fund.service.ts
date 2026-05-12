import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  ClientFundPosition,
  InvestmentFund,
  InvestmentRequest,
  RedemptionRequest,
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

  discovery(): Observable<InvestmentFund[]> {
    return this.http.get<InvestmentFund[]>(this.baseUrl);
  }

  details(fundId: number): Observable<InvestmentFund> {
    return this.http.get<InvestmentFund>(`${this.baseUrl}/${fundId}`);
  }

  invest(fundId: number, req: InvestmentRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${fundId}/invest`, req);
  }

  redeem(fundId: number, req: RedemptionRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${fundId}/redeem`, req);
  }

  myPositions(): Observable<ClientFundPosition[]> {
    return this.http.get<ClientFundPosition[]>(`${this.baseUrl}/my-positions`);
  }

  // PR_11 C11.10: kreiranje fonda (supervisor-only).
  createFund(req: CreateFundRequest): Observable<InvestmentFund> {
    return this.http.post<InvestmentFund>(this.baseUrl, req);
  }

  // PR_11 C11.9: supervised fondovi (Profit Banke + supervisor pregled).
  supervised(): Observable<InvestmentFund[]> {
    return this.http.get<InvestmentFund[]>(`${this.baseUrl}/supervised`);
  }
}
