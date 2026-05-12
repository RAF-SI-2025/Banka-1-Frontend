import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
  CreateCompanyMarginAccountRequest,
  CreateUserMarginAccountRequest,
  MarginAccountResponse,
  MarginTransactionHistoryItem,
  MarginTransferRequest,
  StockMarginTransactionRequest,
} from '../models/margin-account.model';

/**
 * PR_03 C3.8: HTTP klijent za marzne racune.
 *
 * Sve rute prolaze kroz Nginx api-gateway pa nemaju cross-origin probleme.
 * Backend je banking-core-service (port 8084 internal) — Nginx proxy_pass
 * mapira /accounts/createMarginAccount na banking_core_service/accounts/createMarginAccount.
 */
@Injectable({ providedIn: 'root' })
export class MarginAccountService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // ------------------------ Account CRUD ----------------------------------

  createForUser(req: CreateUserMarginAccountRequest): Observable<MarginAccountResponse> {
    return this.http.post<MarginAccountResponse>(
      `${this.baseUrl}/accounts/createMarginAccount`, req,
    );
  }

  createForCompany(req: CreateCompanyMarginAccountRequest): Observable<MarginAccountResponse> {
    return this.http.post<MarginAccountResponse>(
      `${this.baseUrl}/accounts/company/createMarginAccount`, req,
    );
  }

  getForUser(userId: number): Observable<MarginAccountResponse> {
    return this.http.get<MarginAccountResponse>(
      `${this.baseUrl}/accounts/getMarginUser/${userId}`,
    );
  }

  getForCompany(companyId: number): Observable<MarginAccountResponse> {
    return this.http.get<MarginAccountResponse>(
      `${this.baseUrl}/accounts/company/getMarginCompany/${companyId}`,
    );
  }

  // ------------------------ Trading transactions --------------------------

  buyOnMargin(req: StockMarginTransactionRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/transactions/stockBuyMarginTransaction`, req,
    );
  }

  sellOnMargin(req: StockMarginTransactionRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/transactions/stockSellMarginTransaction`, req,
    );
  }

  // ------------------------ Add/Withdraw ----------------------------------

  addToMargin(userId: number, req: MarginTransferRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/transactions/addToMargin/${userId}`, req,
    );
  }

  withdrawFromMargin(userId: number, req: MarginTransferRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/transactions/withdrawFromMargin/${userId}`, req,
    );
  }

  // ------------------------ History ---------------------------------------

  getAllTransactions(accountNumber: string): Observable<MarginTransactionHistoryItem[]> {
    return this.http.get<MarginTransactionHistoryItem[]>(
      `${this.baseUrl}/transactions/getAllMarginTransactions/${accountNumber}`,
    );
  }
}
