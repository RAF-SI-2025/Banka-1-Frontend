import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TaxUser } from '../models/tax-user.model';

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private readonly baseUrl = `${environment.apiUrl}/order/tax`;
  constructor(private http: HttpClient) {}

  getTaxDebtors(): Observable<TaxUser[]> {
    return this.http.get<TaxUser[]>(`${this.baseUrl}/tracking`);
  }

    triggerTaxCalculation(): Observable<void> {
    const runUrl = `${environment.apiUrl}/order/internal/tax/capital-gains/run`;
    return this.http.post<void>(runUrl, {});
  }
}