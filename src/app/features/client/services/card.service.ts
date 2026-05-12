import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Card } from '../models/card.model';

export interface AccountDto {
  nazivRacuna: string;
  brojRacuna: string;
  raspolozivoStanje: number;
  currency: string;
  accountCategory: string;
  accountType: string;
  subtype: string | null;
}

export interface AccountPage {
  content: AccountDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AccountDetailsDto {
  nazivRacuna: string;
  brojRacuna: string;
  cards: Card[];
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'DINACARD' | 'AMEX';
export type CardRequestRecipientType = 'OWNER' | 'AUTHORIZED_PERSON';
export type AuthorizedPersonGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AuthorizedPersonRequestDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: AuthorizedPersonGender;
  email: string;
  phone: string;
  address: string;
}

export interface ClientCardRequestDto {
  accountNumber: string;
  cardBrand: CardBrand;
  cardLimit: number;
  verificationId: number;
}

export interface BusinessCardRequestDto {
  accountNumber: string;
  recipientType: CardRequestRecipientType;
  authorizedPersonId?: number | null;
  authorizedPerson?: AuthorizedPersonRequestDto | null;
  cardBrand: CardBrand;
  cardLimit: number;
  verificationId: number;
}

export interface CardRequestResponseDto {
  status: string;
  message: string;
  verificationRequestId: number | null;
  createdCard: unknown | null;
}

/**
 * PR_32: row shape returned by `GET /api/cards/all` for the employee cards
 * management portal. Mirrors {@code CardAdminSummaryDTO} on the backend.
 */
export interface CardAdminSummary {
  id: number;
  cardNumber: string;
  brand: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DEACTIVATED';
  accountNumber: string;
  clientId: number;
  cardLimit: number;
}

/**
 * PR_32: Spring Data Page envelope returned for `GET /api/cards/all`.
 * Only the fields the UI consumes are typed.
 */
export interface CardAdminPage {
  content: CardAdminSummary[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly accountsBase = `${environment.apiUrl}/accounts/client`;
  private readonly cardsBase = `${environment.apiUrl}/api/cards`;

  constructor(private readonly http: HttpClient) {}

  public getMyAccounts(page = 0, size = 100): Observable<AccountPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AccountPage>(`${this.accountsBase}/accounts`, { params });
  }

  public getAccountDetails(accountNumber: string): Observable<AccountDetailsDto> {
    return this.http.get<AccountDetailsDto>(`${this.accountsBase}/api/accounts/${accountNumber}`);
  }

  public blockCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.cardsBase}/id/${cardId}/block`, {});
  }

  /**
   * PR_32: unblocks a previously blocked card.
   * Employee-only endpoint (the gateway rejects clients).
   * Allowed transition: BLOCKED -> ACTIVE.
   */
  public unblockCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.cardsBase}/id/${cardId}/unblock`, {});
  }

  /**
   * PR_32: permanently deactivates a card.
   * Employee-only endpoint. Deactivation is irreversible.
   * Allowed transitions: ACTIVE -> DEACTIVATED or BLOCKED -> DEACTIVATED.
   */
  public deactivateCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.cardsBase}/id/${cardId}/deactivate`, {});
  }

  /**
   * PR_32: bank-wide paginated card listing for the employee
   * "Portal za upravljanje karticama" screen.
   *
   * <p>Returns a Spring Data `Page` envelope. {@code status} is one of
   * {@code ACTIVE / BLOCKED / DEACTIVATED} (case-insensitive on the backend).
   * {@code search} is matched against masked card number, account number, and
   * brand label.
   */
  public getAllCards(
    page: number,
    size: number,
    status?: string,
    search?: string,
  ): Observable<CardAdminPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<CardAdminPage>(`${this.cardsBase}/all`, { params });
  }

  public requestPersonalCard(body: ClientCardRequestDto): Observable<CardRequestResponseDto> {
    return this.http.post<CardRequestResponseDto>(`${this.cardsBase}/request`, body);
  }

  public requestBusinessCard(body: BusinessCardRequestDto): Observable<CardRequestResponseDto> {
    return this.http.post<CardRequestResponseDto>(`${this.cardsBase}/request/business`, body);
  }

  public maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length >= 8) {
      const first4 = digits.slice(0, 4);
      const last4 = digits.slice(-4);
      // Spec Celina 2: prve 4 cifre + 8 zvezdica + zadnje 4 (npr. 5798********5571)
      return `${first4}${'*'.repeat(8)}${last4}`;
    }

    return cardNumber;
  }

  public formatAccountLabel(account: AccountDto): string {
    return `${account.nazivRacuna} (${account.brojRacuna})`;
  }

  public isBusinessAccount(account: AccountDto): boolean {
    const category = (account.accountCategory || '').toLowerCase();
    const type = (account.accountType || '').toLowerCase();
    const subtype = (account.subtype || '').toLowerCase();

    return (
      category.includes('business') ||
      category.includes('pravno') ||
      type.includes('business') ||
      type.includes('pravni') ||
      subtype === 'doo' ||
      subtype === 'ad' ||
      subtype === 'foundation'
    );
  }
}
