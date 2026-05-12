import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Payment, PaymentStatus } from '../models/payment.model';

export interface TransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  verificationSessionId: number;
}

export interface TransferResponse {
  id: number;
  fromAccountNumber: string;
  toAccountNumber: string;
  initialAmount: number;
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

  transfer(request: TransferRequest): Observable<TransferResponse> {
    /* PR_31 hotfix: trailing slash je generisao 404 jer banking-core mapping
       je `/transfers` exact (nije `/transfers/`). Bez trailing slash radi kroz
       nginx gateway upstream `banking_core_service`. */
    return this.http.post<TransferResponse>(this.baseUrl, request);
  }

  previewTransfer(request: Omit<TransferRequest, 'verificationSessionId'>): Observable<TransferPreview> {
    return this.http.post<TransferPreview>(`${this.baseUrl}/preview`, request);
  }

  getTransferHistory(accountNumber: string, currencyMap: Map<string, string>, page = 0, size = 20): Observable<{ content: Payment[], totalElements: number, totalPages: number, number: number, size: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.baseUrl}/accounts/${accountNumber}`, { params }).pipe(
      map(res => ({
        content: (res.content ?? []).map((item: any) => this.mapTransferToPayment(item, accountNumber, currencyMap)),
        totalElements: res.totalElements ?? 0,
        totalPages: res.totalPages ?? 0,
        number: res.number ?? 0,
        size: res.size ?? size
      }))
    );
  }

  private mapTransferToPayment(item: any, accountNumber: string, currencyMap: Map<string, string>): Payment {
    const statusMap: Record<string, PaymentStatus> = {
      COMPLETED: 'REALIZED',
      DENIED: 'REJECTED',
      REJECTED: 'REJECTED',
      PENDING: 'PROCESSING',
      PROCESSING: 'PROCESSING'
    };

    const isSender = item.fromAccountNumber === accountNumber;
    const amount = isSender ? -(item.initialAmount ?? 0) : (item.finalAmount ?? 0);
    const fromCurrency = currencyMap.get(item.fromAccountNumber) ?? 'RSD';
    const toCurrency = currencyMap.get(item.toAccountNumber) ?? fromCurrency;
    const currency = isSender ? fromCurrency : toCurrency;
    const timestamp = item.timestamp ?? item.createdAt ?? '';

    return {
      id: item.id ?? 0,
      date: timestamp ? timestamp.split('T')[0] : '',
      timestamp,
      orderNumber: item.orderNumber ?? '',
      payerName: '',
      recipientName: item.toAccountNumber ?? '',
      payerAccountNumber: item.fromAccountNumber ?? '',
      recipientAccountNumber: item.toAccountNumber ?? '',
      currency,
      fromCurrency,
      finalCurrency: toCurrency,
      amount,
      initialAmount: item.initialAmount ?? 0,
      finalAmount: item.finalAmount ?? 0,
      fee: item.commission ?? 0,
      status: statusMap[item.status?.toUpperCase()] ?? 'REALIZED',
      type: 'TRANSFER',
      purpose: item.paymentPurpose ?? '',
      referenceNumber: item.referenceNumber ?? undefined,
      paymentCode: item.paymentCode ?? ''
    };
  }
}
