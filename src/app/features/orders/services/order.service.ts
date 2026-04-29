import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateOrderRequest, OrderResponse } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/order/orders`;

  constructor(private readonly http: HttpClient) {}

  createBuyOrder(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/buy`, payload);
  }

  createSellOrder(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/sell`, payload);
  }

  confirmOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/${orderId}/confirm`, {});
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, {});
  }
}
