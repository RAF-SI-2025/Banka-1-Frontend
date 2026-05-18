import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateOrderRequest, MyOrder, MyOrderRaw, MyOrdersPageResponse, OrderResponse,
} from '../models/order.model';

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
    return this.http.post<OrderResponse>(`${this.baseUrl}/${orderId}/confirm`, null);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/${orderId}/cancel`, null);
  }

  getMyOrders(): Observable<MyOrder[]> {
    return this.http
      .get<MyOrdersPageResponse | MyOrderRaw[]>(`${this.baseUrl}/my`)
      .pipe(
        map(response => {
          const rawOrders = Array.isArray(response)
            ? response
            : response.content ?? [];

          return rawOrders.map(order => this.mapMyOrder(order));
        }),
      );
  }

  private mapMyOrder(order: MyOrderRaw): MyOrder {
    return {
      id: Number(order.id ?? order.orderId ?? 0),
      orderType: order.orderType ?? order.type ?? 'MARKET',
      ticker:
        order.ticker ??
        order.symbol ??
        order.securityTicker ??
        order.listingTicker ??
        '-',
      securityName:
        order.securityName ??
        order.listingName ??
        order.name ??
        '-',
      securityType:
        order.securityType ??
        order.listingType ??
        order.assetType ??
        '-',
      quantity: Number(order.quantity ?? 0),
      executionPrice:
        order.executionPrice ??
        order.averageExecutionPrice ??
        order.pricePerUnit ??
        null,
      status: order.status ?? 'PENDING',
      createdAt:
        order.createdAt ??
        order.creationDate ??
        order.createdDate ??
        order.lastModification ??
        null,
      executedAt:
        order.executedAt ??
        order.executionDate ??
        order.doneAt ??
        null,
      paidFee:
        order.paidFee ??
        order.fee ??
        order.commission ??
        null,
    };
  }
}
