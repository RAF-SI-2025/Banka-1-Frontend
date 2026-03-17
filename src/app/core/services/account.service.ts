import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}

  /**
   * Dohvata listu aktivnih računa ulogovanog klijenta.
   * JWT se automatski dodaje kroz AuthInterceptor.
   */
  getMyAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/my`);
  }

  /**
   * Dohvata detalje jednog računa po ID-u.
   */
  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  /**
   * Menja naziv računa.
   */
  renameAccount(id: number, name: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/name`, { name });
  }

  /**
   * Menja dnevni i mesečni limit računa.
   */
  changeLimit(id: number, dailyLimit: number, monthlyLimit: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/limit`, { dailyLimit, monthlyLimit });
  }
}
