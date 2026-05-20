import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PriceAlertCondition,
  PriceAlertNotificationType,
  SecurityForAlert,
} from '../../models/price-alert.model';
import { PriceAlertService } from '../../services/price-alert.service';

@Component({
  selector: 'app-price-alert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './price-alert-modal.component.html',
})
export class PriceAlertModalComponent {
  @Input() security!: SecurityForAlert;
  @Output() closed = new EventEmitter<void>();

  condition: PriceAlertCondition = 'ABOVE';
  threshold: number | null = null;
  notificationType: PriceAlertNotificationType = 'IN_APP';
  errorMessage = '';

  readonly conditionOptions: { value: PriceAlertCondition; label: string }[] = [
    { value: 'ABOVE', label: 'Cena iznad vrednosti' },
    { value: 'BELOW', label: 'Cena ispod vrednosti' },
    { value: 'DAILY_DROP_PERCENT', label: 'Pad za X% u toku dana' },
  ];

  readonly notificationOptions: { value: PriceAlertNotificationType; label: string }[] = [
    { value: 'IN_APP', label: 'In-app notifikacija' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
  ];

  constructor(private readonly priceAlertService: PriceAlertService) {}

  get thresholdLabel(): string {
    return this.condition === 'DAILY_DROP_PERCENT' ? 'Prag pada (%)' : 'Prag cene';
  }

  get thresholdPlaceholder(): string {
    return this.condition === 'DAILY_DROP_PERCENT' ? 'npr. 5' : 'npr. 150.00';
  }

  close(): void {
    this.errorMessage = '';
    this.closed.emit();
  }

  save(): void {
    const thresholdValue = Number(this.threshold);

    if (!Number.isFinite(thresholdValue) || thresholdValue <= 0) {
      this.errorMessage = 'Unesite validan prag veći od nule.';
      return;
    }

    this.priceAlertService.createAlert({
      security: this.security,
      condition: this.condition,
      threshold: thresholdValue,
      notificationType: this.notificationType,
    });

    this.closed.emit();
  }
}
