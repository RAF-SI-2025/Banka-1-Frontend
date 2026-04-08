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

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly accountsBase = `${environment.apiUrl}/accounts/client`;
  private readonly cardsBase = `${environment.apiUrl}/cards`;

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

  public blockCard(cardNumber: string): Observable<void> {
    return this.http.put<void>(`${this.cardsBase}/${cardNumber}/block`, {});
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
      return `${first4} **** **** ${last4}`;
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
