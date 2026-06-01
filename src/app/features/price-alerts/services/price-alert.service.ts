import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreatePriceAlertRequest,
  PriceAlert,
  PriceAlertCondition,
  PriceAlertNotificationType,
} from '../models/price-alert.model';

export interface PriceAlertDto {
  id: number;
  userId: number;
  listingId: number;
  condition: PriceAlertCondition;
  threshold: number;
  notificationType: PriceAlertNotificationType;
  active: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PriceAlertService {
  private readonly baseUrl = `${environment.apiUrl}/price-alerts`;

  constructor(private readonly http: HttpClient) {}

  getPriceAlerts(): Observable<PriceAlertDto[]> {
    return this.http.get<PriceAlertDto[]>(this.baseUrl);
  }

  createPriceAlert(payload: {
    listingId: number;
    condition: PriceAlertCondition;
    threshold: number;
    notificationType: PriceAlertNotificationType;
  }): Observable<PriceAlertDto> {
    return this.http.post<PriceAlertDto>(this.baseUrl, payload);
  }

  updatePriceAlert(alertId: number, payload: {
    condition?: PriceAlertCondition;
    threshold?: number;
    notificationType?: PriceAlertNotificationType;
  }): Observable<PriceAlertDto> {
    return this.http.patch<PriceAlertDto>(`${this.baseUrl}/${alertId}`, payload);
  }

  togglePriceAlert(alertId: number, active: boolean): Observable<PriceAlertDto> {
    return this.http.patch<PriceAlertDto>(`${this.baseUrl}/${alertId}`, { active });
  }

  deletePriceAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${alertId}`);
  }
}
