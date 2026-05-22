import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RecurringOrder } from '../models/recurring-order.model';

@Injectable({
  providedIn: 'root'
})
export class RecurringOrderService {

  private apiUrl = `${environment.apiUrl}/recurring-orders`;

  constructor(private http: HttpClient) {}

  getRecurringOrders(): Observable<RecurringOrder[]> {
    return this.http.get<RecurringOrder[]>(this.apiUrl);
  }

  createRecurringOrder(payload: any): Observable<void> {
    return this.http.post<void>(this.apiUrl, payload);
  }

  pauseRecurringOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/pause`, {});
  }

  cancelRecurringOrder(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancel`, {});
  }
}