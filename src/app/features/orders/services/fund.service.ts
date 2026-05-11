import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Fund } from '../models/fund.model';

@Injectable({ providedIn: 'root' })
export class FundService {
  // TODO: Zameniti pravim endpointom nakon usaglašavanja sa bekendom
  private readonly api = `${environment.apiUrl}/funds`;

  constructor(private readonly http: HttpClient) {}

  getMySupervisorFunds(): Observable<Fund[]> {
    return of([
      { id: 1, name: 'Fond rasta', balance: 150000, currency: 'RSD' },
      { id: 2, name: 'Konzervativni fond', balance: 5000, currency: 'USD' },
    ]);
  }

  // TODO: Uskladiti endpoint sa backend timom
  getFundsBySupervisorId(_supervisorId: number): Observable<Fund[]> {
    return of([
      { id: 1, name: 'Fond rasta', balance: 150000, currency: 'RSD' },
      { id: 2, name: 'Konzervativni fond', balance: 5000, currency: 'USD' },
    ]);
  }

  // TODO: Uskladiti endpoint sa backend timom
  transferFundOwnership(supervisorId: number, newManagerId: number): Observable<void> {
    return this.http.put<void>(`${this.api}/transfer`, { supervisorId, newManagerId });
  }
}
