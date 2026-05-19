import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateRecurringOrderRequest,
  RecurringOrder,
} from '../models/recurring-order.model';

/**
 * WP-23 (Celina 3 — DCA): Recurring (standing) Orders client.
 *
 * <p>Wraps the JWT-secured recurring-order endpoints exposed through the
 * gateway at `/recurring-orders`. The {@link AuthInterceptor} attaches the
 * `Authorization` header automatically. Every standing order is scoped to the
 * authenticated caller.
 *
 * <p>A recurring order is a DCA standing order: the backend periodically
 * places a Market Order on the caller's behalf. It can be paused / resumed or
 * cancelled at any time.
 */
@Injectable({ providedIn: 'root' })
export class RecurringOrderService {
  private readonly baseUrl = `${environment.apiUrl}/recurring-orders`;

  constructor(private readonly http: HttpClient) {}

  /** Lists every recurring order owned by the caller. */
  getRecurringOrders(): Observable<RecurringOrder[]> {
    return this.http.get<RecurringOrder[]>(this.baseUrl);
  }

  /** Creates a new recurring (DCA) order. */
  createRecurringOrder(
    request: CreateRecurringOrderRequest,
  ): Observable<RecurringOrder> {
    return this.http.post<RecurringOrder>(this.baseUrl, request);
  }

  /** Pauses an active recurring order — the schedule stops placing orders. */
  pause(id: number): Observable<RecurringOrder> {
    return this.http.patch<RecurringOrder>(`${this.baseUrl}/${id}/pause`, {});
  }

  /** Resumes a paused recurring order. */
  resume(id: number): Observable<RecurringOrder> {
    return this.http.patch<RecurringOrder>(`${this.baseUrl}/${id}/resume`, {});
  }

  /** Cancels (deletes) a recurring order by id. */
  deleteRecurringOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
