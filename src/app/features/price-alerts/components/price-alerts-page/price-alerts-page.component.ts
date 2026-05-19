import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StateComponent } from '../../../../shared/components/state/state.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AlertService } from '../../services/alert.service';
import {
  AlertCondition,
  AlertNotificationType,
  PriceAlert,
} from '../../models/price-alert.model';

/**
 * WP-22 (Celina 3): Price-alerts management page (`/price-alerts`).
 *
 * <p>Lists every price alert the caller has set, with a per-row toggle to
 * arm / disarm an alert and a delete action. New alerts are created from the
 * stock-detail / security-detail headers via {@link CreateAlertModalComponent}
 * — this page is the management surface only.
 *
 * <p>Standalone, lazy-loaded via `loadComponent` so it stays out of the
 * initial bundle.
 */
@Component({
  selector: 'app-price-alerts-page',
  standalone: true,
  imports: [CommonModule, RouterModule, StateComponent],
  templateUrl: './price-alerts-page.component.html',
})
export class PriceAlertsPageComponent implements OnInit {
  alerts: PriceAlert[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private readonly alertService: AlertService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.alertService.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Greska pri ucitavanju obavestenja.';
      },
    });
  }

  toggle(alert: PriceAlert): void {
    const next = !alert.active;
    this.alertService.toggleActive(alert.id, next).subscribe({
      next: () => {
        /* Optimistic local flip — avoids a full reload. */
        alert.active = next;
        this.toast.success(
          next ? 'Obavestenje aktivirano.' : 'Obavestenje pauzirano.',
        );
      },
      error: () => this.toast.error('Greska pri izmeni obavestenja.'),
    });
  }

  remove(alert: PriceAlert): void {
    if (!confirm(`Obrisati obavestenje za ${alert.ticker}?`)) {
      return;
    }
    this.alertService.deleteAlert(alert.id).subscribe({
      next: () => {
        this.toast.success('Obavestenje obrisano.');
        this.load();
      },
      error: () => this.toast.error('Greska pri brisanju obavestenja.'),
    });
  }

  conditionLabel(condition: AlertCondition): string {
    switch (condition) {
      case 'ABOVE':
        return 'Cena iznad';
      case 'BELOW':
        return 'Cena ispod';
      case 'PCT_DROP_INTRADAY':
        return 'Intradnevni pad';
      default:
        return condition;
    }
  }

  /** Whether the threshold of this alert should render as a percentage. */
  isPercent(condition: AlertCondition): boolean {
    return condition === 'PCT_DROP_INTRADAY';
  }

  channelLabel(type: AlertNotificationType): string {
    switch (type) {
      case 'EMAIL':
        return 'Email';
      case 'PUSH':
        return 'Push';
      case 'IN_APP':
        return 'U aplikaciji';
      case 'ALL':
        return 'Svi kanali';
      default:
        return type;
    }
  }

  /** Routerlink target for an alert's watched security-detail page. */
  detailLink(alert: PriceAlert): string[] {
    return ['/securities', 'stock', String(alert.listingId)];
  }

  trackByAlert(_: number, alert: PriceAlert): number {
    return alert.id;
  }
}
