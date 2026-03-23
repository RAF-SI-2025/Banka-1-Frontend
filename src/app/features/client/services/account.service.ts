import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Account, ChangeLimitDto } from '../models/account.model';
import { Transaction, TransactionPage } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/accounts/client/accounts`;

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<Account[]> {
    const page = 0;
    const size = 10;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<{ content: Account[] }>(this.baseUrl, { params })
      .pipe(map(res => res.content));
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  /**
   * Dohvata poslednjih N transakcija za dati račun.
   * Koristi se na početnoj strani za prikaz poslednjih 5 transakcija.
   */
  getTransactions(accountId: number, page = 0, size = 5): Observable<Transaction[]> {
    return this.http
      .get<TransactionPage>(`${this.baseUrl}/${accountId}/transactions`, {
        params: { page: page.toString(), size: size.toString() }
      })
      .pipe(map(res => res.content));
  }

  renameAccount(id: number, name: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/name`, { accountName: name });
  }

  changeLimit(id: number, dailyLimit: number, monthlyLimit: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/limit`, { accountLimit: dailyLimit });
  }

  createAccount(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  /**
   * Employee endpoint for all accounts in the system.
   */
  getAllAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
  }

  /**
   * Activate/deactivate account by account ID.
   * Backend endpoint is expected to accept status update.
   */
  updateAccountStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/accounts/${id}/status`, {
      status
    });
  }
}
