import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TaxUserPage } from '../models/tax-user.model';

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private readonly baseUrl = `${environment.apiUrl}/order/tax`;
  constructor(private http: HttpClient) {}

  getTaxDebtors(page = 0, size = 10, userType?: 'CLIENT' | 'ACTUARY'): Observable<TaxUserPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (userType) {
      params = params.set('userType', userType);
    }

    return this.http.get<TaxUserPage>(`${this.baseUrl}/tracking`, { params });
  }

  triggerTaxCalculation(): Observable<void> {
    const runUrl = `${environment.apiUrl}/order/tax/collect`;
    return this.http.post<void>(runUrl, null);
  }

  triggerCurrentMonthTaxCalculation(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/tax/collect/current-month`, null);
  }
}
