import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ToastService } from '@/shared/services/toast.service';
import {
  CreatePriceAlertRequest,
  PriceAlert,
  SecurityForAlert,
} from '../models/price-alert.model';

@Injectable({ providedIn: 'root' })
export class PriceAlertService {
  private readonly alertsSubject = new BehaviorSubject<PriceAlert[]>([]);
  private readonly apiUrl = `${environment.apiUrl}/stock/price-alerts`;

  readonly alerts$ = this.alertsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly toastService: ToastService,
  ) {
    this.refreshAlerts();
  }

  get currentAlerts(): PriceAlert[] {
    return this.alertsSubject.value;
  }

  refreshAlerts(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (alerts) => this.alertsSubject.next(alerts.map((alert) => this.mapFromApi(alert))),
      error: () => this.toastService.error('Greška pri učitavanju price alert-a.'),
    });
  }

  createAlert(request: CreatePriceAlertRequest): void {
    this.http.post<any>(this.apiUrl, {
      listingId: request.security.id,
      condition: this.mapConditionToApi(request.condition),
      threshold: request.threshold,
      notificationType: request.notificationType === 'IN_APP' ? 'PUSH' : request.notificationType,
    }).subscribe({
      next: (alert) => {
        const created = this.mapFromApi(alert, request.security);
        this.alertsSubject.next([created, ...this.currentAlerts]);
        this.toastService.success('Price alert je uspešno kreiran.');
      },
      error: () => this.toastService.error('Greška pri kreiranju price alert-a.'),
    });
  }

  deactivateAlert(alertId: string): void {
    this.http.patch<any>(`${this.apiUrl}/${alertId}`, {}).subscribe({
      next: (alert) => {
        const updatedAlert = this.mapFromApi(alert);
        const updated = this.currentAlerts.map((current) =>
          current.id === alertId ? { ...current, ...updatedAlert } : current,
        );
        this.alertsSubject.next(updated);
      },
      error: () => this.toastService.error('Greška pri deaktiviranju price alert-a.'),
    });
  }

  evaluateSecurities(securities: SecurityForAlert[]): void {
    securities.forEach((security) => this.evaluateSecurity(security));
  }

  evaluateSecurity(security: SecurityForAlert): void {
    const currentPrice = Number(security.price);
    const changePercent = Number(security.changePercent ?? 0);

    if (!Number.isFinite(currentPrice)) {
      return;
    }

    let changed = false;

    const updated = this.currentAlerts.map((alert) => {
      const sameSecurity = alert.securityId === security.id || alert.ticker === security.ticker;

      if (!alert.isActive || !sameSecurity) {
        return alert;
      }

      const triggered = this.isAlertTriggered(alert, currentPrice, changePercent);

      if (!triggered) {
        return alert;
      }

      changed = true;
      this.toastService.success(this.buildNotificationMessage(alert, currentPrice, changePercent));

      return alert;
    });

    if (changed) {
      this.alertsSubject.next(updated);
      this.refreshAlerts();
    }
  }

  private isAlertTriggered(alert: PriceAlert, currentPrice: number, changePercent: number): boolean {
    switch (alert.condition) {
      case 'ABOVE':
        return currentPrice >= alert.threshold;
      case 'BELOW':
        return currentPrice <= alert.threshold;
      case 'DAILY_DROP_PERCENT':
        return changePercent <= -Math.abs(alert.threshold);
      default:
        return false;
    }
  }

  private buildNotificationMessage(alert: PriceAlert, currentPrice: number, changePercent: number): string {
    if (alert.condition === 'ABOVE') {
      return `${alert.ticker} je dostigao/la cenu iznad ${this.formatNumber(alert.threshold)}. Trenutna cena je ${this.formatNumber(currentPrice)}.`;
    }

    if (alert.condition === 'BELOW') {
      return `${alert.ticker} je pao/la ispod ${this.formatNumber(alert.threshold)}. Trenutna cena je ${this.formatNumber(currentPrice)}.`;
    }

    return `${alert.ticker} je pao/la za ${this.formatNumber(Math.abs(changePercent))}% u toku dana.`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private mapConditionToApi(condition: PriceAlert['condition']): string {
    return condition === 'DAILY_DROP_PERCENT' ? 'PCT_DROP_INTRADAY' : condition;
  }

  private mapConditionFromApi(condition: string): PriceAlert['condition'] {
    return condition === 'PCT_DROP_INTRADAY' ? 'DAILY_DROP_PERCENT' : condition as PriceAlert['condition'];
  }

  private mapFromApi(alert: any, security?: CreatePriceAlertRequest['security']): PriceAlert {
    return {
      id: String(alert.id),
      securityId: Number(alert.listingId ?? security?.id ?? 0),
      ticker: alert.ticker ?? security?.ticker ?? `#${alert.listingId}`,
      securityName: alert.securityName ?? security?.name ?? alert.ticker ?? `Hartija #${alert.listingId}`,
      currentPriceAtCreation: Number(security?.price ?? 0),
      condition: this.mapConditionFromApi(alert.condition),
      threshold: Number(alert.threshold ?? 0),
      notificationType: alert.notificationType === 'PUSH' ? 'IN_APP' : alert.notificationType,
      isActive: Boolean(alert.active),
      createdAt: alert.createdAt,
      triggeredAt: alert.lastTriggeredAt ?? undefined,
    };
  }
}
