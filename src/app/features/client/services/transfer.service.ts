import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}

export interface TransferResponse {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  finalAmount: number;
  finalCurrency: string;
  exchangeRate: number | null;
  commission: number;
  commissionCurrency?: string;
  status: string;
  timestamp: string;
  type: string;
}

export interface TransferPreview {
  fromAccount: string;
  toAccount: string;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  exchangeRate: number;
  commission: number;
  commissionCurrency: string;
  finalAmount: number;
  ownerName: string;
}

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly baseUrl = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) {}

  transferDifferentCurrency(request: TransferRequest): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(`${this.baseUrl}/different-currency`, request);
  }

  previewTransfer(request: TransferRequest): Observable<TransferPreview> {
    return this.http.post<TransferPreview>(`${this.baseUrl}/preview`, request);
  }
}
