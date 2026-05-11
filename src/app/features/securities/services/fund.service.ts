import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {Fund, FundFilters, FundSortConfig, SecuritiesPage} from '../models/security.model';

export interface InvestRequest {
  fundId: number;
  accountNumber: string;
  amount: number;
}

@Injectable({providedIn: 'root'})
export class FundService {
  private readonly baseUrl = `${environment.apiUrl}/funds`;

  constructor(private readonly http: HttpClient) {
  }

  getFunds(
    filters: FundFilters = {},
    page = 0,
    size = 10,
    sort?: FundSortConfig
  ): Observable<SecuritiesPage<Fund>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.search) params = params.set('search', filters.search);
    if (filters.totalValueMin != null) params = params.set('totalValueMin', filters.totalValueMin);
    if (filters.totalValueMax != null) params = params.set('totalValueMax', filters.totalValueMax);
    if (filters.profitMin != null) params = params.set('profitMin', filters.profitMin);
    if (filters.profitMax != null) params = params.set('profitMax', filters.profitMax);
    if (filters.minimumContributionMin != null) params = params.set('minimumContributionMin', filters.minimumContributionMin);
    if (filters.minimumContributionMax != null) params = params.set('minimumContributionMax', filters.minimumContributionMax);
    if (sort) {
      params = params.set('sortBy', sort.field).set('sortDirection', sort.direction);
    }

    return this.http.get<SecuritiesPage<Fund>>(this.baseUrl, {params});
  }

  invest(request: InvestRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${request.fundId}/invest`, {
      accountNumber: request.accountNumber,
      amount: request.amount,
    });
  }

}
