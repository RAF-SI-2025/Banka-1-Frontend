import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RecurringOrder, RecurringOrderMode, OrderDirection, RecurringInterval } from '../models/recurring-order.model';

export interface CreateRecurringOrderPayload {
  listingId: number;
  direction: OrderDirection;
  mode: RecurringOrderMode;
  value: number;
  accountId: number;
  cadence: RecurringInterval;
  nextRun?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecurringOrderService {

  private apiUrl = `${environment.apiUrl}/recurring-orders`;

  constructor(private http: HttpClient) {}

  getRecurringOrders(): Observable<RecurringOrder[]> {
    return this.http.get<RecurringOrder[]>(this.apiUrl);
  }

  createRecurringOrder(payload: CreateRecurringOrderPayload): Observable<RecurringOrder> {
    return this.http.post<RecurringOrder>(this.apiUrl, payload);
  }

  pauseRecurringOrder(id: number): Observable<RecurringOrder> {
    return this.http.patch<RecurringOrder>(`${this.apiUrl}/${id}/pause`, {});
  }

  resumeRecurringOrder(id: number): Observable<RecurringOrder> {
    return this.http.patch<RecurringOrder>(`${this.apiUrl}/${id}/resume`, {});
  }

  cancelRecurringOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}