import { Component, OnInit } from '@angular/core';
import {
  CreateRecurringOrderPayload,
  RecurringCadence,
  RecurringMode,
  RecurringOrder
} from '../../models/recurring-order.model';
import { RecurringOrderService } from '../../services/recurring-order.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-recurring-order',
  templateUrl: './recurring-order.component.html',
  styleUrls: ['./recurring-order.component.scss']
})
export class RecurringOrderComponent implements OnInit {
  recurringOrders: RecurringOrder[] = [];
  isLoading = false;
  isSubmitting = false;

  listingId: number | null = null;
  accountId: number | null = null;
  mode: RecurringMode = 'BY_AMOUNT';
  value: number | null = null;
  cadence: RecurringCadence = 'MONTHLY';
  dayOfMonth: number | null = null;

  readonly modes = [
    { value: 'BY_AMOUNT' as RecurringMode, label: 'Po iznosu' },
    { value: 'BY_QUANTITY' as RecurringMode, label: 'Po kolicini' }
  ];

  readonly cadences = [
    { value: 'DAILY' as RecurringCadence, label: 'Dnevno' },
    { value: 'WEEKLY' as RecurringCadence, label: 'Nedeljno' },
    { value: 'MONTHLY' as RecurringCadence, label: 'Mesecno' }
  ];

  readonly listingHints = 'AAPL = 1, MSFT = 2';

  constructor(
    private recurringOrderService: RecurringOrderService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRecurringOrders();
  }

  loadRecurringOrders(): void {
    this.isLoading = true;

    this.recurringOrderService.getRecurringOrders().subscribe({
      next: (data) => {
        this.recurringOrders = data;
        this.isLoading = false;
      },
      error: () => {
        this.recurringOrders = [];
        this.isLoading = false;
      }
    });
  }

  createRecurringOrder(): void {
    if (!this.listingId || this.listingId <= 0 || !this.accountId || this.accountId <= 0 || !this.value || this.value <= 0) {
      this.toastService.error('Unesite hartiju, racun i validnu vrednost.');
      return;
    }

    if (this.cadence === 'MONTHLY' && this.dayOfMonth !== null && (this.dayOfMonth < 1 || this.dayOfMonth > 31)) {
      this.toastService.error('Dan u mesecu mora biti izmedju 1 i 31.');
      return;
    }

    this.isSubmitting = true;

    const payload: CreateRecurringOrderPayload = {
      listingId: this.listingId,
      direction: 'BUY',
      mode: this.mode,
      value: this.value,
      accountId: this.accountId,
      cadence: this.cadence,
      dayOfMonth: this.cadence === 'MONTHLY' ? this.dayOfMonth : null
    };

    this.recurringOrderService.createRecurringOrder(payload).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je uspesno kreiran.');
        this.resetForm();
        this.loadRecurringOrders();
        this.isSubmitting = false;
      },
      error: (err) => {
        const message = err.error?.message || 'Greska pri kreiranju trajnog naloga.';
        this.toastService.error(message);
        this.isSubmitting = false;
      }
    });
  }

  pauseOrder(order: RecurringOrder): void {
    if (!confirm(`Da li zelite da pauzirate trajni nalog #${order.id}?`)) return;

    this.recurringOrderService.pauseRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je pauziran.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greska pri pauziranju trajnog naloga.');
      }
    });
  }

  cancelOrder(order: RecurringOrder): void {
    if (!confirm(`Da li zelite da otkazete trajni nalog #${order.id}?`)) return;

    this.recurringOrderService.cancelRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je otkazan.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greska pri otkazivanju trajnog naloga.');
      }
    });
  }

  resetForm(): void {
    this.listingId = null;
    this.accountId = null;
    this.mode = 'BY_AMOUNT';
    this.value = null;
    this.cadence = 'MONTHLY';
    this.dayOfMonth = null;
  }

  formatValue(order: RecurringOrder): string {
    const formatted = new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: order.mode === 'BY_AMOUNT' ? 2 : 0,
      maximumFractionDigits: order.mode === 'BY_AMOUNT' ? 2 : 0
    }).format(order.value);
    return order.mode === 'BY_AMOUNT' ? `${formatted} RSD` : formatted;
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleString('sr-RS') : '-';
  }

  cadenceLabel(value: RecurringCadence): string {
    return this.cadences.find(c => c.value === value)?.label || value;
  }

  modeLabel(value: RecurringMode): string {
    return this.modes.find(m => m.value === value)?.label || value;
  }
}
