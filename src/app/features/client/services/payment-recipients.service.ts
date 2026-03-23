import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PaymentRecipient {
  name: string;
  accountNumber: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentRecipientsService {
  private apiUrl = `${environment.apiUrl}/clients/payment-recipients`;

  constructor(private http: HttpClient) {}

  addRecipient(recipient: PaymentRecipient): Observable<any> {
    return this.http.post(this.apiUrl, recipient);
  }

  getRecipients(): Observable<PaymentRecipient[]> {
    return this.http.get<PaymentRecipient[]>(this.apiUrl);
  }
}