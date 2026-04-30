import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'DONE'
  | 'CANCELLED';
export type OrderFilter = 'ALL' | OrderStatus;
export type OrderDirection = 'BUY' | 'SELL';

export interface OrderOverviewResponse {
  orderId: number;
  agentName: string;
  orderType: string;
  listingType: string;
  quantity: number;
  contractSize: number;
  pricePerUnit: number;
  direction: OrderDirection;
  remainingPortions: number;
  status: OrderStatus;
  /** Datum do kog važi nalog (ako postoji); koristi se za „istekao“ Pending. */
  settlementDate?: string;
  validUntil?: string;
  expiresAt?: string;
  expiryDate?: string;
}

export interface OrderPageResponse {
  content: OrderOverviewResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Vraća prvi poznat datum isteka iz DTO-a (Swagger može koristiti različita imena polja). */
export function resolveOrderExpiryDate(
  o: OrderOverviewResponse,
): string | undefined {
  const candidates = [
    o.settlementDate,
    o.validUntil,
    o.expiresAt,
    o.expiryDate,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      return c.trim();
    }
  }
  return undefined;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/order/orders`;

  constructor(private http: HttpClient) {}

  getOrders(
    status: OrderFilter = 'PENDING',
    page = 0,
    size = 10,
  ): Observable<OrderPageResponse> {
    const params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<OrderPageResponse>(this.apiUrl, { params });
  }

  approveOrder(id: number): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}/approve`, {});
  }

  declineOrder(id: number): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}/decline`, {});
  }

  cancelOrder(id: number, quantity?: number): Observable<unknown> {
    const body = quantity ? { quantity } : {};
    return this.http.put(`${this.apiUrl}/${id}/cancel`, body);
  }
}
