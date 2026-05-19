import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FormModalComponent } from '../../../../shared/components/form-modal/form-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AlertService } from '../../services/alert.service';
import {
  AlertCondition,
  AlertNotificationType,
  PriceAlert,
} from '../../models/price-alert.model';

/**
 * WP-22 (Celina 3): "Postavi obavestenje" — create price-alert modal.
 *
 * <p>A reusable `z-overlay`/`z-modal` form opened by the "Postavi obavestenje"
 * button on the stock-detail / security-detail headers. The trader picks a
 * trigger condition (above / below / intraday percent drop), a target value
 * and a delivery channel; submitting calls {@link AlertService.createAlert}.
 *
 * <p>Standalone — drop `<app-create-alert-modal>` into any standalone
 * component that knows the listing id and ticker it is arming an alert for.
 */

interface ConditionOption {
  value: AlertCondition;
  label: string;
}

interface ChannelOption {
  value: AlertNotificationType;
  label: string;
}

@Component({
  selector: 'app-create-alert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModalComponent],
  templateUrl: './create-alert-modal.component.html',
})
export class CreateAlertModalComponent {
  /** Listing id of the security the alert watches. */
  @Input({ required: true }) listingId!: number;
  /** Ticker shown in the modal title — purely cosmetic. */
  @Input() ticker = '';

  /** Emitted when the modal should close (cancel or after a successful save). */
  @Output() close = new EventEmitter<void>();
  /** Emitted with the created alert after a successful save. */
  @Output() created = new EventEmitter<PriceAlert>();

  condition: AlertCondition = 'ABOVE';
  threshold: number | null = null;
  notificationType: AlertNotificationType = 'IN_APP';

  submitting = false;
  error: string | null = null;

  readonly conditionOptions: ConditionOption[] = [
    { value: 'ABOVE', label: 'Cena iznad' },
    { value: 'BELOW', label: 'Cena ispod' },
    { value: 'PCT_DROP_INTRADAY', label: 'Intradnevni pad (%)' },
  ];

  readonly channelOptions: ChannelOption[] = [
    { value: 'IN_APP', label: 'U aplikaciji' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'PUSH', label: 'Push' },
    { value: 'ALL', label: 'Svi kanali' },
  ];

  constructor(
    private readonly alertService: AlertService,
    private readonly toast: ToastService,
  ) {}

  /** True when the threshold input should be read as a percentage. */
  get isPercent(): boolean {
    return this.condition === 'PCT_DROP_INTRADAY';
  }

  onCancel(): void {
    if (this.submitting) {
      return;
    }
    this.close.emit();
  }

  submit(): void {
    if (this.threshold === null || this.threshold <= 0) {
      this.error = this.isPercent
        ? 'Unesite procenat veci od 0.'
        : 'Unesite ciljnu cenu vecu od 0.';
      return;
    }
    this.submitting = true;
    this.error = null;
    this.alertService
      .createAlert({
        listingId: this.listingId,
        condition: this.condition,
        threshold: this.threshold,
        notificationType: this.notificationType,
      })
      .subscribe({
        next: (alert) => {
          this.submitting = false;
          this.toast.success('Obavestenje postavljeno.');
          this.created.emit(alert);
          this.close.emit();
        },
        error: () => {
          this.submitting = false;
          this.error = 'Greska pri postavljanju obavestenja.';
        },
      });
  }
}
