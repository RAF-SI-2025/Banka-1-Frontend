import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
  CounterInterbankNegotiationRequest,
  CounterOfferRequest,
  CreateInterbankNegotiationRequest,
  CreateOtcOfferRequest,
  InterbankNegotiationView,
  OptionContract,
  OptionContractStatus,
  OtcOffer,
} from '../models/otc.model';

/**
 * PR_33 Phase B: routing number nase banke i Banka 2.
 * Cross-bank ponude se obelezavaju badge-om "Banka 2" u UI-u.
 */
const BANKA1_ROUTING = 111;
const BANKA2_ROUTING = 222;
const BANKA2_LABEL = 'Banka 2';

@Injectable({ providedIn: 'root' })
export class OtcService {
  private readonly baseUrl = `${environment.apiUrl}/otc`;
  private readonly interbankUrl = `${environment.apiUrl}/api/interbank/otc/negotiations`;

  constructor(private http: HttpClient) {}

  createOffer(req: CreateOtcOfferRequest): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(`${this.baseUrl}/offers`, req);
  }

  counterOffer(offerId: number, req: CounterOfferRequest): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(`${this.baseUrl}/offers/${offerId}/counter`, req);
  }

  accept(offerId: number): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(`${this.baseUrl}/offers/${offerId}/accept`, null);
  }

  reject(offerId: number): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(`${this.baseUrl}/offers/${offerId}/reject`, null);
  }

  activeForCurrentUser(): Observable<OtcOffer[]> {
    return this.http.get<OtcOffer[]>(`${this.baseUrl}/offers/active`);
  }

  exercise(contractId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/contracts/${contractId}/exercise`, null);
  }

  /**
   * PR_14 C14.5: backend ruta GET /otc/contracts/my (PR_13 C13.3) — sklopljeni
   * ugovori za current user-a (server cita id iz JWT-a). status filter je opcioni.
   */
  myContracts(status?: OptionContractStatus): Observable<OptionContract[]> {
    const url = status
      ? `${this.baseUrl}/contracts/my?status=${status}`
      : `${this.baseUrl}/contracts/my`;
    return this.http.get<OptionContract[]>(url);
  }

  // ------------------------------------------------------------------
  // PR_33 Phase B: Inter-bank wrapper API.
  // Backend ruta `/api/interbank/otc/negotiations` (banking-stack wrapper
  // koji forwarduje na `interbank-service` sa S2S JWT-om). UI prepoznaje
  // ove pregovore preko `interbank=true` flag-a u mapiranom OtcOffer-u.
  // ------------------------------------------------------------------

  getInterbankNegotiations(): Observable<InterbankNegotiationView[]> {
    return this.http.get<InterbankNegotiationView[]>(this.interbankUrl);
  }

  /**
   * PR_33 follow-up: dohvati javne akcije iz partner banke (default 222 = Banka 2).
   * Vraca lista PublicStockEntry; svaki entry ima `stock.ticker` i niz `sellers` sa
   * `{seller: ForeignBankId, amount, pricePerUnit}`.
   */
  getPartnerPublicStock(bankCode: number = 222): Observable<any[]> {
    const url = `${environment.apiUrl}/api/interbank/otc/public-stock?bankCode=${bankCode}`;
    return this.http.get<any[]>(url);
  }

  createInterbankNegotiation(req: CreateInterbankNegotiationRequest): Observable<InterbankNegotiationView> {
    return this.http.post<InterbankNegotiationView>(this.interbankUrl, req);
  }

  counterInterbankNegotiation(
    localId: string,
    req: CounterInterbankNegotiationRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.interbankUrl}/${localId}/counter`, req);
  }

  acceptInterbankNegotiation(localId: string): Observable<void> {
    return this.http.post<void>(`${this.interbankUrl}/${localId}/accept`, null);
  }

  deleteInterbankNegotiation(localId: string): Observable<void> {
    return this.http.delete<void>(`${this.interbankUrl}/${localId}`);
  }

  /**
   * PR_33 Phase B: spojeni feed intra-bank ponuda + inter-bank pregovora.
   * Frontend UI poziva ovu metodu umesto `activeForCurrentUser()` da bi
   * dobio jedinstvenu listu sa `interbank` flag-om po redu.
   *
   * Ako inter-bank API padne (npr. servis dole), graciozno fallback-uje na
   * samo intra-bank ponude (ne ruši stranicu).
   */
  getActiveOffers(): Observable<OtcOffer[]> {
    const local$ = this.activeForCurrentUser().pipe(
      map(items => items.map(o => this.markLocal(o))),
      catchError(() => of([] as OtcOffer[])),
    );
    const interbank$ = this.getInterbankNegotiations().pipe(
      map(items => items.map(n => this.toOfferFromNegotiation(n))),
      catchError(() => of([] as OtcOffer[])),
    );
    return forkJoin([local$, interbank$]).pipe(
      map(([local, interbank]) => [...local, ...interbank]),
    );
  }

  /**
   * PR_33 Phase B helper — markira intra-bank ponude eksplicitno (interbank=false).
   * Korisno za UI grananje i filter mode.
   */
  private markLocal(o: OtcOffer): OtcOffer {
    return {
      ...o,
      interbank: false,
      counterpartyBankCode: BANKA1_ROUTING,
      counterpartyBankName: 'Naša banka',
    };
  }

  /**
   * PR_33 Phase B helper — mapuje `InterbankNegotiationView` u `OtcOffer` shape
   * kako bi tabela na frontu mogla da renderuje jednu listu. Buyer/seller su
   * stringovi `"C-{n}"` ili `"E-{n}"` sa routingNumber-om; `id` polje OtcOffer-a
   * je numericko, ali zna se da je interbank tip → koristimo hash localId-a kao
   * sentinel (UI bira `localId` za sve API pozive).
   */
  private toOfferFromNegotiation(n: InterbankNegotiationView): OtcOffer {
    const s = n.state;
    return {
      // Sentinel: ne koristi se direktno za API pozive (interbank flow gleda localId).
      id: 0,
      stockTicker: s.stock.ticker,
      buyerId: 0,
      sellerId: 0,
      amount: s.amount,
      pricePerStock: s.pricePerUnit.amount,
      premium: s.premium.amount,
      settlementDate: s.settlementDate,
      status: s.isOngoing ? 'PENDING_BUYER' : 'ACCEPTED',
      modifiedBy: `${s.lastModifiedBy.routingNumber}:${s.lastModifiedBy.id}`,
      lastModified: '',
      interbank: true,
      counterpartyBankCode: n.remoteForeignBankId.routingNumber,
      counterpartyBankName: this.bankNameFor(n.remoteForeignBankId.routingNumber),
      localId: n.localId,
      remoteId: n.remoteForeignBankId.id,
    };
  }

  /** PR_33 Phase B: routing number → display name. Trenutno samo Banka 2; lako se prosiri. */
  private bankNameFor(routingNumber: number): string {
    if (routingNumber === BANKA2_ROUTING) return BANKA2_LABEL;
    if (routingNumber === BANKA1_ROUTING) return 'Naša banka';
    return `Banka #${routingNumber}`;
  }
}
