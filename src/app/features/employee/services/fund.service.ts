import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FundPosition } from '../models/fund-position';

@Injectable({
  providedIn: 'root'
})
export class FundService {
  private apiUrl = `${environment.apiUrl}/order/fund-positions`;

  constructor(private http: HttpClient) {}

  getFundPositions(): Observable<FundPosition[]> {
    return this.http.get<FundPosition[]>(this.apiUrl);
  }

  deposit(fundId: number, accountNumber: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${fundId}/deposit`, {
      accountNumber
    });
  }

  withdraw(fundId: number, accountNumber: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${fundId}/withdraw`, {
      accountNumber
    });
  }
}