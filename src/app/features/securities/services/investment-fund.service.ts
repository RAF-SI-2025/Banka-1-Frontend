import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateInvestmentFundRequest,
  InvestmentFund,
  InvestmentFundsPage,
} from '../models/investment-fund.model';

@Injectable({ providedIn: 'root' })
export class InvestmentFundService {
  private readonly apiUrl = `${environment.apiUrl}/stock/api/funds`;

  constructor(private readonly http: HttpClient) {}

  getFunds(page = 0, size = 100): Observable<InvestmentFundsPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => this.mapFundsResponse(response, page, size)),
    );
  }

  createFund(payload: CreateInvestmentFundRequest): Observable<InvestmentFund> {
    return this.http
      .post<any>(this.apiUrl, payload)
      .pipe(map((response) => this.mapFund(response)));
  }

  private mapFundsResponse(response: any, page: number, size: number): InvestmentFundsPage {
    const content = Array.isArray(response)
      ? response
      : response?.content ?? response?.funds ?? [];

    return {
      content: content.map((fund: any) => this.mapFund(fund)),
      totalElements: response?.totalElements ?? content.length,
      totalPages: response?.totalPages ?? Math.ceil(content.length / size),
      number: response?.number ?? page,
      size: response?.size ?? size,
    };
  }

  private mapFund(fund: any): InvestmentFund {
    return {
      id: Number(fund.id ?? fund.fundId ?? 0),
      name: fund.name ?? fund.naziv ?? '',
      description: fund.description ?? fund.opis ?? '',
      minimumContribution: Number(
        fund.minimumContribution ?? fund.minimumContribuiton ?? fund.minimalniUlog ?? 0,
      ),
      managerId: Number(fund.managerId ?? fund.menadzerId ?? fund.manager?.id ?? 0),
      managerName:
        fund.managerName ??
        fund.menadzerIme ??
        [fund.manager?.ime, fund.manager?.prezime].filter(Boolean).join(' '),
      accountNumber: fund.accountNumber ?? fund.racun,
      liquidAssets: Number(fund.liquidAssets ?? fund.likvidnaSredstva ?? 0),
      totalValue: Number(fund.totalValue ?? fund.vrednostFonda ?? 0),
      profit: Number(fund.profit ?? 0),
      createdAt: fund.createdAt ?? fund.datumKreiranja,
    };
  }
}
