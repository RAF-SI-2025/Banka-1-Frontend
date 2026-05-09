import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  OtcOffer,
  OtcOfferPage,
  CreateOtcOfferRequest,
  CounterOfferRequest,
  OptionalContractRequest,
} from '../models/otc-offer.model';

@Injectable({
  providedIn: 'root',
})
export class OtcOfferService {
  private readonly baseUrl = `${environment.apiUrl}/otc/offers`;
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);

  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Dobija sve aktivne ponude za logovanog korisnika
   */
  getActiveOffers(page = 0, size = 10): Observable<OtcOfferPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('status', 'PENDING,COUNTER_OFFER');
    return this.http.get<OtcOfferPage>(`${this.baseUrl}/active`, { params });
  }

  /**
   * Dobija sve ponude za logovanog korisnika (sa filterovanjem)
   */
  getOffers(status?: string, page = 0, size = 10): Observable<OtcOfferPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<OtcOfferPage>(this.baseUrl, { params });
  }

  /**
   * Dobija detalje jedne ponude
   */
  getOfferById(offerId: number): Observable<OtcOffer> {
    return this.http.get<OtcOffer>(`${this.baseUrl}/${offerId}`);
  }

  /**
   * Kreira novu ponudu
   */
  createOffer(request: CreateOtcOfferRequest): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(this.baseUrl, request);
  }

  /**
   * Prihvata ponudu - pokreće kreiranje opcionalnog ugovora i isplatu premije
   */
  acceptOffer(offerId: number, premiumAmount: number): Observable<any> {
    const request: OptionalContractRequest = {
      otcOfferId: offerId,
      premiumAmount,
    };
    return this.http.post(`${this.baseUrl}/${offerId}/accept`, request);
  }

  /**
   * Odbija/odustaje od ponude
   */
  rejectOffer(offerId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${offerId}/reject`, {});
  }

  /**
   * Šalje kontraponudu
   */
  sendCounterOffer(request: CounterOfferRequest): Observable<OtcOffer> {
    return this.http.post<OtcOffer>(
      `${this.baseUrl}/${request.otcOfferId}/counter-offer`,
      request
    );
  }

  /**
   * Dobija broj nepročitanih ponuda
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread/count`);
  }

  /**
   * Ažurira broj nepročitanih ponuda
   */
  updateUnreadCount(): void {
    this.getUnreadCount().subscribe(
      (count) => this.unreadCountSubject.next(count),
      () => this.unreadCountSubject.next(0)
    );
  }

  /**
   * Označa ponudu kao pročitanu
   */
  markAsRead(offerId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${offerId}/mark-as-read`, {});
  }
}
