import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators'; // Dodato za paginaciju kada pređeš na backend
import { environment } from '../../../../environments/environment';
import { Account, ChangeLimitDto } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/client/accounts`;

  // MOCK PODACI
  private mockAccounts: Account[] = [
    {
      id: 1,
      name: 'Platni Račun',
      accountNumber: '265-0000001234567-89',
      balance: 150000.00,
      availableBalance: 145000.00,
      reservedFunds: 5000.00,
      currency: 'RSD',
      status: 'ACTIVE',
      subtype: 'STANDARD',
      ownerId: 101,
      ownerName: 'Marko Marković',
      employeeId: 1,
      maintenanceFee: 250,
      dailyLimit: 50000,
      monthlyLimit: 200000,
      dailySpending: 1200,
      monthlySpending: 45000,
      createdAt: '2025-01-10T10:00:00Z',
      expiryDate: '2030-01-10T10:00:00Z'
    },
    {
      id: 2,
      name: 'Štednja za more',
      accountNumber: '265-0000009876543-21',
      balance: 1200.50,
      availableBalance: 1200.50,
      reservedFunds: 0.00,
      currency: 'EUR',
      status: 'ACTIVE',
      subtype: 'SAVINGS',
      ownerId: 101,
      ownerName: 'Marko Marković',
      employeeId: 1,
      maintenanceFee: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      dailySpending: 0,
      monthlySpending: 0,
      createdAt: '2025-02-15T09:30:00Z',
      expiryDate: '2035-02-15T09:30:00Z'
    }
  ];

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<Account[]> {
     return this.http.get<any>(this.baseUrl).pipe(map(res => res.content));
    
    // console.log('Mock: Vraćam listu računa');
    // return of(this.mockAccounts).pipe(delay(500));
  }

  getAccountById(id: number): Observable<Account> {
     return this.http.get<Account>(`${this.baseUrl}/${id}`);
    
    // const account = this.mockAccounts.find(a => a.id === id) || this.mockAccounts[0];
    // return of(account).pipe(delay(300));
  }

  renameAccount(id: number, name: string): Observable<void> {
     return this.http.patch<void>(`${this.baseUrl}/${id}/name`, { accountName: name });
    
    // console.log(` Mock: Menjam naziv računa ${id} u ${name}`);
    // return of(undefined).pipe(delay(200));
  }

  changeLimit(id: number, dailyLimit: number, monthlyLimit: number): Observable<void> {
     return this.http.patch<void>(`${this.baseUrl}/${id}/limit`, { accountLimit: dailyLimit });
    
    // console.log(`Mock: Menjam limite za račun ${id}`);
    // return of(undefined).pipe(delay(200));
  }
  /**
   * Menja limite računa pozivom odgovarajućeg endpointa na backendu.
   * @param accountId ID računa koji se ažurira
   * @param payload Objekat koji sadrži nove limite i verifikacioni kod
   * @returns Observable koji vraća odgovor sa bekenda
   */
  changeAccountLimits(accountId: number, payload: ChangeLimitDto): Observable<void> {
    const url = `${this.baseUrl}/${accountId}/limits`; 
    
    return this.http.put<void>(url, payload);
  }
}