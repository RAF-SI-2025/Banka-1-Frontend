import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecurringOrder, RecurringOrderMode, RecurringInterval, OrderDirection } from '../../models/recurring-order.model';
import { RecurringOrderService, CreateRecurringOrderPayload } from '../../services/recurring-order.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AccountService } from '../../../client/services/account.service';
import { SecuritiesService } from '../../../securities/services/securities.service';
import { Account } from '../../../client/models/account.model';

@Component({
  selector: 'app-recurring-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recurring-order.component.html',
  styleUrls: ['./recurring-order.component.scss'],
})
export class RecurringOrderComponent implements OnInit {
  recurringOrders: RecurringOrder[] = [];
  isLoading = false;
  isCreating = false;
  showCreateForm = false;

  // Create form
  selectedListingId: number | null = null;
  selectedDirection: OrderDirection = 'BUY';
  selectedMode: RecurringOrderMode = 'BY_AMOUNT';
  selectedValue: number | null = null;
  selectedAccountId: number | null = null;
  selectedCadence: RecurringInterval = 'WEEKLY';
  nextRun: string = '';

  // Dropdowns
  accounts: Account[] = [];
  securities: any[] = [];
  accountsLoading = false;
  securitiesLoading = false;

  readonly directions: OrderDirection[] = ['BUY', 'SELL'];
  readonly modes: { value: RecurringOrderMode; label: string }[] = [
    { value: 'BY_AMOUNT', label: 'Po iznosu (RSD)' },
    { value: 'BY_QUANTITY', label: 'Po količini' },
  ];
  readonly cadences: { value: RecurringInterval; label: string }[] = [
    { value: 'DAILY', label: 'Svaki dan' },
    { value: 'WEEKLY', label: 'Svake nedelje' },
    { value: 'MONTHLY', label: 'Svaki mesec' },
  ];

  constructor(
    private readonly recurringOrderService: RecurringOrderService,
    private readonly accountService: AccountService,
    private readonly securitiesService: SecuritiesService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRecurringOrders();
    this.loadAccounts();
    this.loadSecurities();
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
        this.toastService.error('Greška pri učitavanju trajnih naloga.');
      }
    });
  }

  loadAccounts(): void {
    this.accountsLoading = true;
    this.accountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts = data.filter(a => a.status === 'ACTIVE');
        if (this.accounts.length > 0) {
          this.selectedAccountId = this.accounts[0].id;
        }
        this.accountsLoading = false;
      },
      error: () => {
        this.accountsLoading = false;
      }
    });
  }

  loadSecurities(): void {
    this.securitiesLoading = true;
    this.securitiesService.getSecurities().subscribe({
      next: (response: any) => {
        this.securities = response.content || response || [];
        this.securitiesLoading = false;
      },
      error: () => {
        this.securitiesLoading = false;
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  createRecurringOrder(): void {
    if (!this.selectedListingId || this.selectedValue === null || !this.selectedAccountId) {
      this.toastService.error('Popunite sva obavezna polja.');
      return;
    }

    if (this.selectedValue <= 0) {
      this.toastService.error('Vrednost mora biti veća od 0.');
      return;
    }

    this.isCreating = true;

    const payload: CreateRecurringOrderPayload = {
      listingId: this.selectedListingId,
      direction: this.selectedDirection,
      mode: this.selectedMode,
      value: this.selectedValue,
      accountId: this.selectedAccountId,
      cadence: this.selectedCadence,
      nextRun: this.nextRun || undefined,
    };

    this.recurringOrderService.createRecurringOrder(payload).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je uspešno kreiran.');
        this.resetForm();
        this.showCreateForm = false;
        this.loadRecurringOrders();
        this.isCreating = false;
      },
      error: (err) => {
        const message = err.error?.message || 'Greška pri kreiranju trajnog naloga.';
        this.toastService.error(message);
        this.isCreating = false;
      }
    });
  }

  pauseOrder(order: RecurringOrder): void {
    if (!confirm(`Da li želite da pauzirate ovaj trajni nalog?`)) {
      return;
    }

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

  resumeOrder(order: RecurringOrder): void {
    if (!confirm(`Da li želite da aktivirate ovaj trajni nalog?`)) {
      return;
    }

    this.recurringOrderService.resumeRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je aktiviran.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri aktiviranju trajnog naloga.');
      }
    });
  }

  cancelOrder(order: RecurringOrder): void {
    if (!confirm(`Da li ste sigurni da želite da obbrišete ovaj trajni nalog?`)) {
      return;
    }

    this.recurringOrderService.cancelRecurringOrder(order.id).subscribe({
      next: () => {
        this.toastService.success('Trajni nalog je obrisan.');
        this.loadRecurringOrders();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri brisanju trajnog naloga.');
      }
    });
  }

  getSecurityName(listingId: number): string {
    const security = this.securities.find(s => s.id === listingId || s.listingId === listingId);
    return security ? `${security.ticker} - ${security.name}` : `ID: ${listingId}`;
  }

  getAccountName(accountId: number): string {
    const account = this.accounts.find(a => a.id === accountId);
    return account ? account.accountNumber : `ID: ${accountId}`;
  }

  getCadenceLabel(cadence: RecurringInterval): string {
    return this.cadences.find(c => c.value === cadence)?.label || cadence;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('sr-RS');
  }

  getStatusBadgeClass(status: string): string {
    if (status === 'ACTIVE') return 'status-success';
    if (status === 'PAUSED') return 'status-warning';
    return 'status-danger';
  }

  private resetForm(): void {
    this.selectedListingId = null;
    this.selectedDirection = 'BUY';
    this.selectedMode = 'BY_AMOUNT';
    this.selectedValue = null;
    this.selectedAccountId = this.accounts.length > 0 ? this.accounts[0].id : null;
    this.selectedCadence = 'WEEKLY';
    this.nextRun = '';
  }

  trackById(index: number, order: RecurringOrder): number {
    return order.id;
  }
}
