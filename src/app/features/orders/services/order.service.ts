import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateOrderRequest, MyOrderResponse, OrderResponse, OrderStatus } from '../models/order.model';

export interface MyOrdersPageRequest {
  status?: OrderStatus | '';
  listingType?: string | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

  getMyOrders(): Observable<MyOrderResponse[]> {
    return this.http.get<MyOrderResponse[]>(`${this.baseUrl}/my-orders`);
  }

  getMyOrdersPaged(request: MyOrdersPageRequest): Observable<PageResponse<MyOrderResponse>> {
    let params = new HttpParams();
    
    if (request.status) {
      params = params.set('status', request.status);
    }
    if (request.listingType) {
      params = params.set('listingType', request.listingType);
    }
    if (request.dateFrom) {
      params = params.set('dateFrom', request.dateFrom);
    }
    if (request.dateTo) {
      params = params.set('dateTo', request.dateTo);
    }
    if (request.page !== undefined) {
      params = params.set('page', request.page.toString());
    }
    if (request.size !== undefined) {
      params = params.set('size', request.size.toString());
    }
    
    return this.http.get<PageResponse<MyOrderResponse>>(`${this.baseUrl}/my-orders/paged`, { params });
  }

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

}
