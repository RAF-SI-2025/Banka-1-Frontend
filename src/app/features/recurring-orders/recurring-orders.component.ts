import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StateComponent } from '../../shared/components/state/state.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
import { ToastService } from '../../shared/services/toast.service';
import { RecurringOrderService } from './services/recurring-order.service';
import {
  CreateRecurringOrderRequest,
  RecurringCadence,
  RecurringDirection,
  RecurringMode,
  RecurringOrder,
} from './models/recurring-order.model';

/**
 * WP-23 (Celina 3 — DCA): Recurring (standing) Orders page (`/recurring-orders`).
 *
 * <p>Lists every recurring DCA order the caller has set, with a per-row
 * pause / resume toggle and a cancel action. New orders are created from an
 * `<app-form-modal>` create panel — the caller picks the listing, the side,
 * the sizing mode (`BY_QUANTITY` / `BY_AMOUNT`), the value, the charged
 * account, the cadence and the first-run date.
 *
 * <p>Reachable by every authenticated trader — clients-with-trading and
 * actuary agents — via the lazy `recurring-orders` route. Standalone,
 * lazy-loaded via `loadComponent` so it stays out of the initial bundle.
 */

interface SelectOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-recurring-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, StateComponent, FormModalComponent],
  templateUrl: './recurring-orders.component.html',
})
export class RecurringOrdersComponent implements OnInit {
  orders: RecurringOrder[] = [];
  isLoading = true;
  error: string | null = null;

  /* Create-modal state. */
  modalOpen = false;
  submitting = false;
  formError: string | null = null;

  /* Create-form model. */
  listingId: number | null = null;
  direction: RecurringDirection = 'BUY';
  mode: RecurringMode = 'BY_AMOUNT';
  value: number | null = null;
  accountId: number | null = null;
  cadence: RecurringCadence = 'MONTHLY';
  nextRun = '';

  readonly directionOptions: SelectOption<RecurringDirection>[] = [
    { value: 'BUY', label: 'Kupovina' },
    { value: 'SELL', label: 'Prodaja' },
  ];

  readonly modeOptions: SelectOption<RecurringMode>[] = [
    { value: 'BY_AMOUNT', label: 'Po iznosu' },
    { value: 'BY_QUANTITY', label: 'Po kolicini' },
  ];

  readonly cadenceOptions: SelectOption<RecurringCadence>[] = [
    { value: 'DAILY', label: 'Dnevno' },
    { value: 'WEEKLY', label: 'Nedeljno' },
    { value: 'MONTHLY', label: 'Mesecno' },
  ];

  constructor(
    private readonly recurringOrderService: RecurringOrderService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.recurringOrderService.getRecurringOrders().subscribe({
      next: (orders) => {
        this.orders = orders ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Greska pri ucitavanju trajnih naloga.';
      },
    });
  }

  /** True when `value` should render as a money amount rather than a count. */
  get isByAmount(): boolean {
    return this.mode === 'BY_AMOUNT';
  }

  openModal(): void {
    this.resetForm();
    this.modalOpen = true;
  }

  closeModal(): void {
    if (this.submitting) {
      return;
    }
    this.modalOpen = false;
  }

  /** Resets the create-form to its defaults. */
  private resetForm(): void {
    this.listingId = null;
    this.direction = 'BUY';
    this.mode = 'BY_AMOUNT';
    this.value = null;
    this.accountId = null;
    this.cadence = 'MONTHLY';
    this.nextRun = '';
    this.formError = null;
    this.submitting = false;
  }

  submit(): void {
    const validationError = this.validate();
    if (validationError) {
      this.formError = validationError;
      return;
    }
    this.submitting = true;
    this.formError = null;

    const request: CreateRecurringOrderRequest = {
      listingId: this.listingId!,
      direction: this.direction,
      mode: this.mode,
      value: this.value!,
      accountId: this.accountId!,
      cadence: this.cadence,
      nextRun: this.nextRun,
    };

    this.recurringOrderService.createRecurringOrder(request).subscribe({
      next: () => {
        this.submitting = false;
        this.modalOpen = false;
        this.toast.success('Trajni nalog kreiran.');
        this.load();
      },
      error: () => {
        this.submitting = false;
        this.formError = 'Greska pri kreiranju trajnog naloga.';
      },
    });
  }

  /** Returns a Serbian validation message, or `null` when the form is valid. */
  private validate(): string | null {
    if (this.listingId === null || this.listingId <= 0) {
      return 'Unesite ID hartije od vrednosti.';
    }
    if (this.value === null || this.value <= 0) {
      return this.isByAmount
        ? 'Unesite iznos veci od 0.'
        : 'Unesite kolicinu vecu od 0.';
    }
    if (this.accountId === null || this.accountId <= 0) {
      return 'Unesite ID racuna.';
    }
    if (!this.nextRun) {
      return 'Izaberite datum prvog izvrsenja.';
    }
    return null;
  }

  pause(order: RecurringOrder): void {
    if (!order.active) {
      return;
    }
    this.recurringOrderService.pause(order.id).subscribe({
      next: () => {
        /* Optimistic local flip — avoids a full reload. */
        order.active = false;
        this.toast.success('Trajni nalog pauziran.');
      },
      error: () => this.toast.error('Greska pri pauziranju naloga.'),
    });
  }

  resume(order: RecurringOrder): void {
    if (order.active) {
      return;
    }
    this.recurringOrderService.resume(order.id).subscribe({
      next: () => {
        order.active = true;
        this.toast.success('Trajni nalog aktiviran.');
      },
      error: () => this.toast.error('Greska pri aktiviranju naloga.'),
    });
  }

  cancel(order: RecurringOrder): void {
    if (!confirm('Otkazati ovaj trajni nalog? Ova akcija je nepovratna.')) {
      return;
    }
    this.recurringOrderService.deleteRecurringOrder(order.id).subscribe({
      next: () => {
        this.toast.success('Trajni nalog otkazan.');
        this.load();
      },
      error: () => this.toast.error('Greska pri otkazivanju naloga.'),
    });
  }

  directionLabel(direction: RecurringDirection): string {
    return direction === 'BUY' ? 'Kupovina' : 'Prodaja';
  }

  modeLabel(mode: RecurringMode): string {
    return mode === 'BY_AMOUNT' ? 'Po iznosu' : 'Po kolicini';
  }

  cadenceLabel(cadence: RecurringCadence): string {
    return (
      this.cadenceOptions.find((o) => o.value === cadence)?.label ?? cadence
    );
  }

  trackByOrder(_: number, order: RecurringOrder): number {
    return order.id;
  }
}
