import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '@/shared/services/toast.service';
import {
  CreatePriceAlertRequest,
  PriceAlert,
  SecurityForAlert,
} from '../models/price-alert.model';

const STORAGE_KEY = 'banka1_price_alerts';

@Injectable({ providedIn: 'root' })
export class PriceAlertService {
  private readonly alertsSubject = new BehaviorSubject<PriceAlert[]>(this.loadInitialAlerts());

  readonly alerts$ = this.alertsSubject.asObservable();

  constructor(private readonly toastService: ToastService) {}

  get currentAlerts(): PriceAlert[] {
    return this.alertsSubject.value;
  }

  createAlert(request: CreatePriceAlertRequest): void {
    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      securityId: request.security.id,
      ticker: request.security.ticker,
      securityName: request.security.name,
      currentPriceAtCreation: Number(request.security.price) || 0,
      condition: request.condition,
      threshold: Number(request.threshold) || 0,
      notificationType: request.notificationType,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.updateAlerts([alert, ...this.currentAlerts]);
  }

  deactivateAlert(alertId: string): void {
    const updated = this.currentAlerts.map((alert) =>
      alert.id === alertId ? { ...alert, isActive: false } : alert,
    );

    this.updateAlerts(updated);
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
      const triggeredAlert: PriceAlert = {
        ...alert,
        isActive: false,
        triggeredAt: new Date().toISOString(),
      };

      this.toastService.success(this.buildNotificationMessage(alert, currentPrice, changePercent));

      return triggeredAlert;
    });

    if (changed) {
      this.updateAlerts(updated);
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

  private loadInitialAlerts(): PriceAlert[] {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as PriceAlert[];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private updateAlerts(alerts: PriceAlert[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    this.alertsSubject.next(alerts);
  }
}
