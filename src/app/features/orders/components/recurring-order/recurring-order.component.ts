import { Component, OnInit } from '@angular/core';
import { RecurringOrder } from '../../models/recurring-order.model';
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

  ticker = '';
  amountRsd: number | null = null;
  currency = 'RSD';
  interval = 'DAILY';
  dayOfMonth: number | null = null;

  currencies = ['RSD', 'EUR', 'USD', 'CHF', 'GBP'];
  intervals = [
    { value: 'DAILY', label: 'Dnevno' },
    { value: 'WEEKLY', label: 'Nedeljno' },
    { value: 'MONTHLY', label: 'Mesečno' }
  ];

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
    if (!this.ticker.trim() || !this.amountRsd || this.amountRsd <= 0) {
      this.toastService.error('Unesite hartiju i validan iznos.');
      return;
    }

    if (this.interval === 'MONTHLY' && (!this.dayOfMonth || this.dayOfMonth < 1 || this.dayOfMonth > 31)) {
      this.toastService.error('Za mesečni interval unesite dan u mesecu od 1 do 31.');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ticker: this.ticker.trim().toUpperCase(),
      amountRsd: this.amountRsd,
      currency: this.currency,
      interval: this.interval,
      dayOfMonth: this.interval === 'MONTHLY' ? this.dayOfMonth : null
    };

    this.recurringOrderService.createRecurringOrder(payload).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je uspešno kreiran.');
        this.resetForm();
        this.loadRecurringOrders();
        this.isSubmitting = false;
      },
      error: (err) => {
        const message = err.error?.message || 'Greška pri kreiranju trajnog naloga.';
        this.toastService.error(message);
        this.isSubmitting = false;
      }
    });
  }

  pauseOrder(order: RecurringOrder): void {
    const confirmed = confirm(`Da li želite da pauzirate trajni nalog za ${order.ticker}?`);
    if (!confirmed) return;

    this.recurringOrderService.pauseRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je pauziran.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri pauziranju trajnog naloga.');
      }
    });
  }

  cancelOrder(order: RecurringOrder): void {
    const confirmed = confirm(`Da li želite da otkažete trajni nalog za ${order.ticker}?`);
    if (!confirmed) return;

    this.recurringOrderService.cancelRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je otkazan.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri otkazivanju trajnog naloga.');
      }
    });
  }

  resetForm(): void {
    this.ticker = '';
    this.amountRsd = null;
    this.currency = 'RSD';
    this.interval = 'DAILY';
    this.dayOfMonth = null;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleString('sr-RS') : '-';
  }

  getIntervalLabel(value: string): string {
    return this.intervals.find(i => i.value === value)?.label || value;
  }
}
