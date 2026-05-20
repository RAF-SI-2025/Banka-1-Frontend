import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DividendHistoryResponse,
  PortfolioSummary,
  SetPublicQuantityRequest,
} from '../models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly baseUrl = `${environment.apiUrl}/order/portfolio`;

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
   * F10: istorija isplaćenih dividendi za jednu poziciju (portfolio holding id).
   * Backend: order-service — potvrditi kontrakt sa timom.
   */
  getDividendHistory(portfolioId: number): Observable<DividendHistoryResponse> {
    return this.http.get<DividendHistoryResponse>(
      `${this.baseUrl}/${portfolioId}/dividends`,
    );
  }
}
