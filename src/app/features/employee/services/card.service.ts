import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Card, CardDetailDTO } from '../models/card.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = `${environment.apiUrl}/api/cards`;

  constructor(private http: HttpClient) {}

  getCards(clientId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/client/${clientId}`);
  }

  getCardsByAccountNumber(accountNumber: string): Observable<Card[]> {
    return this.http.get<any[]>(`${this.apiUrl}/account/${accountNumber}`).pipe(
      map(cards => cards.map(card => ({
        ...card,
        cardNumber: card.maskedCardNumber || card.cardNumber
      })))
    );
  }

  getCardDetails(cardId: number): Observable<CardDetailDTO> {
    return this.http.get<CardDetailDTO>(`${this.apiUrl}/id/${cardId}`);
  }

  blockCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/id/${cardId}/block`, {});
  }

  unblockCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/id/${cardId}/unblock`, {});
  }

  deactivateCard(cardId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/id/${cardId}/deactivate`, {});
  }
}
