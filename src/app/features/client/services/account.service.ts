import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Account, ChangeLimitDto } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/accounts/client/accounts`;
  private readonly api = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<Account[]> {
    const page = 0;
    const size = 50;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map((res) => {
        if (!res.content) return [];
        const mapped = res.content.map((item: any) =>
          this.mapToAccountFromClient(item),
        );
        return mapped;
      }),
    );
  }

  /**
   * Employee endpoint for all accounts in the system with pagination support.
   */
  getAllAccountsPaginated(
    page: number = 0,
    size: number = 10,
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(
      `${environment.apiUrl}/accounts/employee/accounts`,
      { params },
    );
  }

  private mapToAccountFromClient(item: any): Account {
    const subtype = this.mapToSubtypeFromClient(
      item.subtype,
      item.accountType,
      item.accountCategory,
    );

    const currency = item.currency || item.valuta || 'RSD';

    // Use the server-provided primary key when present; only fall back to the legacy
    // hashAccountNumber bridge if the response is missing `id` for some reason.
    // Hash-derived ids do not map to anything on the backend and broke order BUY/SELL
    // accountId resolution in /internal/accounts/id/{accountId}/details (GHI #199).
    const id =
      typeof item.id === 'number'
        ? item.id
        : this.hashAccountNumber(item.brojRacuna || item.accountNumber || '');

    return {
      id,
      name: item.nazivRacuna || '',
      accountNumber: (item.brojRacuna || item.accountNumber || '').trim(),
      balance: item.stanjeRacuna || 0,
      availableBalance: item.raspolozivoStanje || 0,
      reservedFunds: item.rezervisanaSredstva || 0,
      currency: currency,
      status: item.status || 'ACTIVE',
      subtype: subtype,
      ownerId: item.vlasnik || 0,
      ownerName: '',
      employeeId: 0,
      maintenanceFee: 0,
      dailyLimit: item.dailyLimit || 0,
      monthlyLimit: item.monthlyLimit || 0,
      dailySpending: item.dailySpending || 0,
      monthlySpending: item.monthlySpending || 0,
      createdAt: item.creationDate || new Date().toISOString(),
      expiryDate: item.expirationDate || '',
    } as Account;
  }

  private mapToSubtypeFromClient(
    subtype: string,
    accountType: string,
    accountCategory: string,
  ): any {
    const subtypeMap: Record<string, string> = {
      STANDARDNI: 'STANDARD',
      STEDNI: 'SAVINGS',
      PENZIONERSKI: 'PENSION',
      ZA_MLADE: 'YOUTH',
      ZA_STUDENTE: 'STUDENT',
      ZA_NEZAPOSLENE: 'UNEMPLOYED',
      DOO: 'DOO',
      AD: 'AD',
      FONDACIJA: 'FOUNDATION',
    };

    if (subtype && subtypeMap[subtype]) {
      return subtypeMap[subtype];
    }

    // Fallback for FX accounts which don't have a subtype
    if (accountCategory === 'FX') {
      return accountType === 'BUSINESS' ? 'FOREIGN_BUSINESS' : 'FOREIGN_PERSONAL';
    }

    return 'STANDARD';
  }

  getAccountByNumber(accountNumber: string): Observable<Account> {
    return this.http.get<any>(
      `${environment.apiUrl}/accounts/client/api/accounts/${accountNumber}`
    ).pipe(map(item => this.mapToAccountFromClient(item)));
  }

  getTransactions(
    accountNumber: string,
    page = 0,
    size = 5,
  ): Observable<Transaction[]> {
    return this.http
      .get<any>(
        `${environment.apiUrl}/transactions/accounts/${accountNumber}`,
        {
          params: { page: page.toString(), size: size.toString() },
        },
      )
      .pipe(map((res) => (res.content ?? []).map((item: any): Transaction => ({
        id: 0,
        fromAccountId: 0,
        toAccountNumber: item.toAccountNumber ?? '',
        recipientName: item.recipientName ?? '',
        amount: item.finalAmount ?? item.amount ?? 0,
        currency: item.fromCurrency ?? item.currency ?? 'RSD',
        status: item.status ?? 'COMPLETED',
        description: item.paymentPurpose ?? item.description ?? '',
        createdAt: item.createdAt ?? '',
        type: item.type ?? 'PAYMENT',
      }))));
  }

  renameAccount(accountNumber: string, name: string): Observable<void> {
    return this.http.put<void>(
      `${this.api}/client/api/accounts/${accountNumber}/name`,
      { accountName: name },
      { responseType: 'text' as 'json' },
    );
  }

  changeLimit(
    accountNumber: string,
    dailyLimit: number,
    monthlyLimit: number,
    verificationSessionId: number,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.api}/client/api/accounts/${accountNumber}/limits`,
      { dailyLimit, monthlyLimit, verificationSessionId } as ChangeLimitDto,
      { responseType: 'text' as 'json' },
    );
  }

  createFxAccount(payload: any): Observable<any> {
    return this.http.post(`${this.api}/employee/accounts/fx`, payload);
  }

  createCheckingAccount(payload: any): Observable<any> {
    return this.http.post(`${this.api}/employee/accounts/checking`, payload);
  }

  /**
   * Activate/deactivate account by account ID.
   * Backend endpoint is expected to accept status update.
   */
  updateAccountStatus(
    accountNumber: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Observable<any> {
    return this.http.put<any>(
      `${this.api}/employee/accounts/${accountNumber}/status`,
      { status },
      { responseType: 'text' as 'json' }
    );
  }

  /**
   * Generate unique numeric ID from account number
   */
  private hashAccountNumber(accountNumber: string): number {
    let hash = 0;
    for (let i = 0; i < accountNumber.length; i++) {
      const char = accountNumber.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

getBankAccountByCurrency(currency: string): Observable<Account> {
  return this.http.get<any>(`${this.api}/employee/accounts/bank/${currency}`).pipe(
    map(item => this.mapToAccountFromClient(item))
  );
}



}
