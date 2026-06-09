import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Routing broj nase banke (Banka 1). Prve 3 cifre svakog naseg racuna.
 * Mora se poklapati sa OtcService (PR_33 Phase B) gde je takodje 111.
 */
export const BANKA1_ROUTING = '111';

/**
 * Zahtev za medjubankarsko (cross-bank) placanje.
 * Salje se na novi backend endpoint POST /api/interbank/payments.
 * Banka primaoca se identifikuje prvim 3 cifre `toAccount` (routing broj).
 * `amount` je string (decimal-safe), `currency` MORA da odgovara valuti `fromAccount` racuna.
 */
export interface InterbankPaymentRequest {
  fromAccount: string;
  toAccount: string;
  amount: string;
  currency: string;
  message?: string;
}

/** Uspesan odgovor (HTTP 200) sa novog endpointa. */
export interface InterbankPaymentResponse {
  transactionId: string;
  status: 'COMPLETED';
}

@Injectable({ providedIn: 'root' })
export class InterbankPaymentService {
  private readonly endpoint = `${environment.apiUrl}/api/interbank/payments`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Vraca routing broj (prve 3 cifre) datog broja racuna,
   * ili prazan string ako racun nema bar 3 cifre.
   */
  routingOf(accountNumber: string | null | undefined): string {
    const digits = (accountNumber ?? '').trim();
    return digits.length >= 3 ? digits.substring(0, 3) : '';
  }

  /**
   * Tacno kada je dati racun u DRUGOJ banci (cross-bank).
   * True ako routing broj postoji i razlikuje se od naseg (111).
   * Racuni koji pocinju sa 111 su intra-bank i NE idu preko ovog servisa.
   */
  isForeignAccount(accountNumber: string | null | undefined): boolean {
    const routing = this.routingOf(accountNumber);
    return routing.length === 3 && routing !== BANKA1_ROUTING;
  }

  /**
   * Salje cross-bank placanje na novi backend endpoint.
   * Backend pokrece 2PC sa partner bankom; uspeh je {transactionId, status:'COMPLETED'}.
   * Greske dolaze kao {error} (400/401/403/404/409/500).
   */
  sendInterbankPayment(request: InterbankPaymentRequest): Observable<InterbankPaymentResponse> {
    return this.http.post<InterbankPaymentResponse>(this.endpoint, request);
  }
}
