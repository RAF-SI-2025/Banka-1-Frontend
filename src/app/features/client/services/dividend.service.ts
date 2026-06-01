import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DividendPayoutDto {
  id: number;
  stockTicker: string;
  quantity: number;
  grossAmount: number;
  currency: string;
  taxAmountRsd: number;
  netAmount: number;
  accountId: number;
  paymentDate: string;
  forBank: boolean;
}

@Injectable({ providedIn: 'root' })
export class DividendService {
  private readonly baseUrl = `${environment.apiUrl}/dividends`;

  constructor(private readonly http: HttpClient) {}

  getDividends(listingId?: number): Observable<DividendPayoutDto[]> {
    let params = new HttpParams();
    if (listingId) {
      params = params.set('listingId', listingId.toString());
    }
    return this.http.get<DividendPayoutDto[]>(this.baseUrl, { params });
  }
}
