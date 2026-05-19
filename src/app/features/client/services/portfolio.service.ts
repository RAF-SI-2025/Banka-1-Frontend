import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PortfolioSummary,
  SetPublicQuantityRequest,
} from '../models/portfolio.model';
import { DividendPayout } from '../models/dividend.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly baseUrl = `${environment.apiUrl}/order/portfolio`;
  private readonly dividendsUrl = `${environment.apiUrl}/dividends`;

  constructor(private readonly http: HttpClient) {}

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(this.baseUrl);
  }

  setPublicQuantity(
    portfolioId: number,
    request: SetPublicQuantityRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${portfolioId}/set-public`, request);
  }

  exerciseOption(portfolioId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${portfolioId}/exercise-option`, {});
  }

  /**
   * WP-24: vraca istoriju isplacenih dividendi pozivaocu (JWT identitet —
   * Authorization header dodaje AuthInterceptor). Bez `listingId` vraca celu
   * istoriju; sa `listingId` filtrira na jednu poziciju (akciju).
   */
  getDividends(listingId?: number): Observable<DividendPayout[]> {
    let params = new HttpParams();
    if (listingId != null) {
      params = params.set('listingId', String(listingId));
    }
    return this.http.get<DividendPayout[]>(this.dividendsUrl, { params });
  }
}
