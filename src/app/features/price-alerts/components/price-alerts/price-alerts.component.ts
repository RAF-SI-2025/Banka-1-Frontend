import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PriceAlert } from '../../models/price-alert.model';
import { PriceAlertService } from '../../services/price-alert.service';

@Component({
  selector: 'app-price-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-alerts.component.html',
})
export class PriceAlertsPageComponent implements OnInit, OnDestroy {
  alerts: PriceAlert[] = [];
  private sub?: Subscription;

  constructor(private readonly priceAlertService: PriceAlertService) {}

  ngOnInit(): void {
    this.sub = this.priceAlertService.alerts$.subscribe((alerts) => {
      this.alerts = alerts;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get activeAlerts(): PriceAlert[] {
    return this.alerts.filter((a) => a.isActive);
  }

  get inactiveAlerts(): PriceAlert[] {
    return this.alerts.filter((a) => !a.isActive);
  }

  deactivate(alert: PriceAlert): void {
    this.priceAlertService.deactivateAlert(alert.id);
  }

  conditionLabel(alert: PriceAlert): string {
    if (alert.condition === 'ABOVE') return `Iznad ${this.fmt(alert.threshold)}`;
    if (alert.condition === 'BELOW') return `Ispod ${this.fmt(alert.threshold)}`;
    return `Pad ≥ ${this.fmt(alert.threshold)}% dnevno`;
  }

  notificationLabel(alert: PriceAlert): string {
    const map: Record<string, string> = { IN_APP: 'In-app', EMAIL: 'Email', SMS: 'SMS' };
    return map[alert.notificationType] ?? alert.notificationType;
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('sr-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  private fmt(value: number): string {
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
