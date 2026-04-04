import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Card, CardStatus } from '../models/card.model';
import { environment } from '../../../../environments/environment';

// ========== MOCK DATA ==========
const MOCK_CARDS: Card[] = [
  // Cards for account 265-0000000000001-23 (Marko Marković)
  {
    id: 1,
    cardNumber: '4326 **** **** 2988',
    cardType: 'Visa',
    cardName: 'Visa online debit',
    ownerFirstName: 'Marko',
    ownerLastName: 'Marković',
    ownerEmail: 'marko.markovic@gmail.com',
    status: 'AKTIVNA',
    accountNumber: '265-0000000000001-23',
    balance: 1500.50,
    currency: 'RSD'
  },
  {
    id: 2,
    cardNumber: '4326 **** **** 2865',
    cardType: 'Visa',
    cardName: 'Visa Virtual',
    ownerFirstName: 'Ana',
    ownerLastName: 'Marković',
    ownerEmail: 'ana.markovic@gmail.com',
    status: 'BLOKIRANA',
    accountNumber: '265-0000000000001-23',
    balance: 222.20,
    currency: 'RSD'
  },
  {
    id: 3,
    cardNumber: '5799 **** **** 1443',
    cardType: 'MasterCard',
    cardName: 'MasterCard Mobile',
    ownerFirstName: 'Marko',
    ownerLastName: 'Marković',
    ownerEmail: 'marko.markovic@gmail.com',
    status: 'DEAKTIVIRANA',
    accountNumber: '265-0000000000001-23',
    balance: 880.00,
    currency: 'RSD'
  },
  // Cards for account 265-0000000000004-56 (Tech Solutions DOO - business)
  {
    id: 4,
    cardNumber: '4532 **** **** 7821',
    cardType: 'Visa',
    cardName: 'Visa Business',
    ownerFirstName: 'Petar',
    ownerLastName: 'Petrović',
    ownerEmail: 'petar@techsolutions.rs',
    status: 'AKTIVNA',
    accountNumber: '265-0000000000004-56',
    balance: 50000.00,
    currency: 'RSD'
  },
  {
    id: 5,
    cardNumber: '4532 **** **** 7822',
    cardType: 'Visa',
    cardName: 'Visa Business',
    ownerFirstName: 'Jovana',
    ownerLastName: 'Jovanović',
    ownerEmail: 'jovana@techsolutions.rs',
    status: 'AKTIVNA',
    accountNumber: '265-0000000000004-56',
    balance: 25000.00,
    currency: 'RSD'
  },
  // Cards for account 265-0000000000003-45 (Ana Anić - EUR)
  {
    id: 6,
    cardNumber: '5425 **** **** 3344',
    cardType: 'MasterCard',
    cardName: 'MasterCard Gold',
    ownerFirstName: 'Ana',
    ownerLastName: 'Anić',
    ownerEmail: 'ana.anic@gmail.com',
    status: 'AKTIVNA',
    accountNumber: '265-0000000000003-45',
    balance: 500.00,
    currency: 'EUR'
  },
  // Cards for account 265-0000000000005-67 (Jovana Jovanović - student)
  {
    id: 7,
    cardNumber: '4916 **** **** 5566',
    cardType: 'Visa',
    cardName: 'Visa Electron',
    ownerFirstName: 'Jovana',
    ownerLastName: 'Jovanović',
    ownerEmail: 'jovana.jovanovic@hotmail.com',
    status: 'AKTIVNA',
    accountNumber: '265-0000000000005-67',
    balance: 5000.00,
    currency: 'RSD'
  }
];
// ========== END MOCK DATA ==========

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = `${environment.apiUrl}/cards`;

  constructor(private http: HttpClient) {}

  getCardsByAccountNumber(accountNumber: string): Observable<Card[]> {
    // ========== MOCK IMPLEMENTATION ==========
    const cards = MOCK_CARDS.filter(card => card.accountNumber === accountNumber);
    return of(cards);
    // ========== ORIGINAL IMPLEMENTATION ==========
    // return this.http.get<any>(`${this.apiUrl}/employee/account/${accountNumber}`).pipe(
    //   map(response => this.mapCardsResponse(response))
    // );
  }

  blockCard(cardId: number): Observable<void> {
    // ========== MOCK IMPLEMENTATION ==========
    const card = MOCK_CARDS.find(c => c.id === cardId);
    if (card) {
      card.status = 'BLOKIRANA';
    }
    return of(undefined);
    // ========== ORIGINAL IMPLEMENTATION ==========
    // return this.http.put<void>(`${this.apiUrl}/employee/${cardId}/block`, {});
  }

  unblockCard(cardId: number): Observable<void> {
    // ========== MOCK IMPLEMENTATION ==========
    const card = MOCK_CARDS.find(c => c.id === cardId);
    if (card) {
      card.status = 'AKTIVNA';
    }
    return of(undefined);
    // ========== ORIGINAL IMPLEMENTATION ==========
    // return this.http.put<void>(`${this.apiUrl}/employee/${cardId}/unblock`, {});
  }

  deactivateCard(cardId: number): Observable<void> {
    // ========== MOCK IMPLEMENTATION ==========
    const card = MOCK_CARDS.find(c => c.id === cardId);
    if (card) {
      card.status = 'DEAKTIVIRANA';
    }
    return of(undefined);
    // ========== ORIGINAL IMPLEMENTATION ==========
    // return this.http.put<void>(`${this.apiUrl}/employee/${cardId}/deactivate`, {});
  }
}
