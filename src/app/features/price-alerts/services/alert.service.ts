import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreatePriceAlertRequest,
  PriceAlert,
} from '../models/price-alert.model';

/**
 * WP-22 (Celina 3): Price Alert client.
 *
 * <p>Wraps the JWT-secured price-alert endpoints exposed through the gateway
 * at `/price-alerts`. The {@link AuthInterceptor} attaches the `Authorization`
 * header automatically. Every alert is scoped to the authenticated caller.
 *
 * <p>An alert fires when the watched security's price crosses its target; the
 * backend delivers the notification through the channel chosen at creation
 * (`EMAIL` / `PUSH` / `IN_APP` / `ALL`).
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly baseUrl = `${environment.apiUrl}/price-alerts`;

  constructor(private readonly http: HttpClient) {}

  /** Lists every price alert owned by the caller. */
  getAlerts(): Observable<PriceAlert[]> {
    return this.http.get<PriceAlert[]>(this.baseUrl);
  }

  /** Creates a new price alert. */
  createAlert(request: CreatePriceAlertRequest): Observable<PriceAlert> {
    return this.http.post<PriceAlert>(this.baseUrl, request);
  }

  /** Arms or disarms an existing alert. */
  toggleActive(id: number, active: boolean): Observable<PriceAlert> {
    return this.http.patch<PriceAlert>(`${this.baseUrl}/${id}`, { active });
  }

  /** Deletes a price alert by id. */
  deleteAlert(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
