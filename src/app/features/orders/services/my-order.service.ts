import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MyOrderFilter, MyOrderPage } from '../models/my-order.model';

/**
 * WP-22 (Celina 3): "Moji orderi" — order history client.
 *
 * <p>Wraps the JWT-secured trading-service endpoint exposed through the gateway
 * at `GET /orders/my-orders`. The {@link AuthInterceptor} attaches the
 * `Authorization` header automatically.
 *
 * <p>This is deliberately a separate, narrow service from both `OrderService`
 * implementations: `features/orders/services/order.service.ts` only does
 * buy/sell/confirm/cancel, and `features/employee/services/order.service.ts`
 * hits the supervisor-only `GET /order/orders`. "Moji orderi" needs the
 * caller-scoped `/orders/my-orders` history endpoint instead.
 */
@Injectable({ providedIn: 'root' })
export class MyOrderService {
  private readonly baseUrl = `${environment.apiUrl}/orders/my-orders`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches one page of the caller's order history.
   *
   * @param filter optional status / direction / security-type / date-range
   *   filter; empty or `undefined` fields are not sent as query params.
   * @param page 0-indexed page number (matches the backend `PagedModel`).
   * @param size page size.
   */
  getMyOrders(filter: MyOrderFilter = {}, page = 0, size = 10): Observable<MyOrderPage> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.direction) {
      params = params.set('direction', filter.direction);
    }
    if (filter.securityType) {
      params = params.set('securityType', filter.securityType);
    }
    if (filter.from) {
      params = params.set('from', filter.from);
    }
    if (filter.to) {
      params = params.set('to', filter.to);
    }

    return this.http.get<MyOrderPage>(this.baseUrl, { params });
  }
}
