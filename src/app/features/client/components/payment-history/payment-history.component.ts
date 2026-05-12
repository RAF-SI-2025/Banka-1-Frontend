import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { Account } from '../../models/account.model';
import {
  Payment,
  PaymentFilters,
  PaymentStatus,
} from '../../models/payment.model';
import { TransactionDetailModalComponent } from '../../modals/transaction-detail-modal/transaction-detail-modal.component';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../../../shared/components/state/state.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TransactionDetailModalComponent,
    StateComponent],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  accounts: Account[] = [];
  selectedAccountNumber = '';
  payments: Payment[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  filters: PaymentFilters = {
    dateFrom: '',
    dateTo: '',
    amountFrom: undefined,
    amountTo: undefined,
    status: '',
    type: 'DOMESTIC',
  };

  draftFilters: PaymentFilters = {
    dateFrom: '',
    dateTo: '',
    amountFrom: undefined,
    amountTo: undefined,
    status: '',
    type: 'DOMESTIC',
  };

  activeTab: 'domestic' | 'transfers' = 'domestic';
  isFilterOpen = false;

  selectedPayment: Payment | null = null;
  isDetailsModalOpen = false;

  statusOptions: { value: PaymentStatus | ''; label: string }[] = [
    { value: '', label: 'Svi statusi' },
    { value: 'REALIZED', label: 'Realizovano' },
    { value: 'PROCESSING', label: 'U obradi' },
    { value: 'REJECTED', label: 'Odbijeno' }];

  constructor(
    private readonly paymentService: PaymentService,
    private readonly accountService: AccountService,
    private readonly transferService: TransferService,
    private readonly router: Router
  ) {}
  
  public onNewPayment(): void {
    this.router.navigate(['/accounts/payment/new']);
  }

  public ngOnInit(): void {
    this.syncDraftFilters();
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts.filter((a) => a.status === 'ACTIVE');
        if (this.accounts.length > 0) {
          this.selectedAccountNumber = this.accounts[0].accountNumber;
          this.loadPayments();
        }
      },
      error: () => {
        this.errorMessage = 'Greška pri učitavanju računa.';
      },
    });
  }

  public onAccountChange(): void {
    this.currentPage = 0;
    this.loadPayments();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadPayments(): void {
    if (!this.selectedAccountNumber) return;
    this.isLoading = true;
    this.errorMessage = '';

    const currencyMap = new Map(
      this.accounts.map((a) => [a.accountNumber, a.currency]),
    );
    const request$ =
      this.activeTab === 'transfers'
        ? this.transferService.getTransferHistory(
            this.selectedAccountNumber,
            currencyMap,
            this.currentPage,
            this.pageSize,
          )
        : this.paymentService.getPayments(
            this.selectedAccountNumber,
            this.filters,
            this.currentPage,
            this.pageSize,
          );

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (page) => {
        this.payments = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Greška pri učitavanju:', error);
        this.errorMessage = 'Došlo je do greške pri učitavanju.';
        this.isLoading = false;
      },
    });
  }

  public toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;

    if (this.isFilterOpen) {
      this.syncDraftFilters();
    }
  }

  public closeFilterPanel(): void {
    this.isFilterOpen = false;
  }

  public applyFilters(): void {
    this.filters = {
      ...this.draftFilters,
      type: this.activeTab === 'domestic' ? 'DOMESTIC' : 'TRANSFER',
    };

    this.currentPage = 0;
    this.loadPayments();
    this.closeFilterPanel();
  }

  public clearFilters(): void {
    this.filters = {
      dateFrom: '',
      dateTo: '',
      amountFrom: undefined,
      amountTo: undefined,
      status: '',
      type: this.activeTab === 'domestic' ? 'DOMESTIC' : 'TRANSFER',
    };

    this.syncDraftFilters();
    this.currentPage = 0;
    this.loadPayments();
    this.closeFilterPanel();
  }

  public goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadPayments();
    }
  }

  public setActiveTab(tab: 'domestic' | 'transfers'): void {
    this.activeTab = tab;
    this.filters.type = tab === 'domestic' ? 'DOMESTIC' : 'TRANSFER';
    this.draftFilters.type = this.filters.type;
    this.currentPage = 0;
    this.loadPayments();
  }

  public openTransactionDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.isDetailsModalOpen = true;
  }

  public closeTransactionDetails(): void {
    this.isDetailsModalOpen = false;
    this.selectedPayment = null;
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) {
      return 'N/A';
    }

    // Parse date string in YYYY-MM-DD format to avoid timezone issues
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  public formatAmount(amount: number): string {
    const prefix = amount >= 0 ? '+' : '';

    return (
      prefix +
      new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  }

  public getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'REALIZED':
        return 'status--realized';
      case 'PROCESSING':
        return 'status--processing';
      case 'REJECTED':
        return 'status--rejected';
      default:
        return '';
    }
  }

  public getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'REALIZED':
        return 'REALIZOVANO';
      case 'PROCESSING':
        return 'U OBRADI';
      case 'REJECTED':
        return 'ODBIJENO';
      default:
        return status;
    }
  }

  public getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  public trackByPaymentId(index: number, payment: Payment): number {
    return payment.id;
  }

  private syncDraftFilters(): void {
    this.draftFilters = {
      ...this.filters,
    };
  }
}
