import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AccountService } from '../../../client/services/account.service';
import { FundService, InvestRequest } from '../../services/fund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Fund, FundFilters, FundSortConfig, FundSortField } from '../../models/security.model';
import { Account } from '../../../client/models/account.model';

@Component({
  selector: 'app-fund-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './fund-discovery.component.html',
  styleUrls: ['./fund-discovery.component.scss'],
})
export class FundDiscoveryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  funds: Fund[] = [];
  isLoading = false;
  isInvesting = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  searchQuery = '';
  filters: FundFilters = {};
  sortConfig: FundSortConfig = { field: 'name', direction: 'asc' };

  isClient = false;
  isSupervisor = false;

  // Invest modal
  showInvestModal = false;
  selectedFund: Fund | null = null;
  investAmount: number | null = null;
  selectedAccountNumber = '';
  accounts: Account[] = [];
  accountsLoading = false;

  constructor(
    private readonly fundService: FundService,
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.isClient = this.authService.isClient();
    this.isSupervisor = this.authService.hasPermission('FUND_AGENT_MANAGE');
    this.loadFunds();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFunds(): void {
    this.isLoading = true;

    this.fundService
      .getFunds(this.filters, this.currentPage, this.pageSize, this.sortConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.funds = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
          this.isLoading = false;
        },
        error: () => {
          this.toastService.error('Greška pri učitavanju fondova.');
          this.isLoading = false;
        },
      });
  }

  onSearchChange(): void {
    this.filters = { ...this.filters, search: this.searchQuery };
    this.currentPage = 0;
    this.loadFunds();
  }

  toggleSort(field: FundSortField): void {
    if (this.sortConfig.field === field) {
      this.sortConfig = { field, direction: this.sortConfig.direction === 'asc' ? 'desc' : 'asc' };
    } else {
      this.sortConfig = { field, direction: 'asc' };
    }
    this.loadFunds();
  }

  sortIcon(field: FundSortField): string {
    if (this.sortConfig.field !== field) return '↕';
    return this.sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  sortIconClass(field: FundSortField): string {
    return this.sortConfig.field === field ? 'text-primary' : 'text-muted-foreground';
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadFunds();
    }
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  navigateToCreateFund(): void {
    this.router.navigate(['/create-fund']);
  }

  openInvestModal(fund: Fund): void {
    this.selectedFund = fund;
    this.investAmount = null;
    this.selectedAccountNumber = '';
    this.showInvestModal = true;
    this.loadAccounts();
  }

  closeInvestModal(): void {
    this.showInvestModal = false;
    this.selectedFund = null;
  }

  private loadAccounts(): void {
    this.accountsLoading = true;
    this.accountService
      .getMyAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts.filter(a => a.status === 'ACTIVE');
          if (this.accounts.length > 0) {
            this.selectedAccountNumber = this.accounts[0].accountNumber;
          }
          this.accountsLoading = false;
        },
        error: () => {
          this.toastService.error('Greška pri učitavanju računa.');
          this.accountsLoading = false;
        },
      });
  }

  get investAmountError(): string | null {
    if (this.investAmount === null) return null;
    if (this.investAmount <= 0) return 'Iznos mora biti pozitivan.';
    if (this.selectedFund && this.investAmount < this.selectedFund.minimumContribution) {
      return `Minimalni ulog je ${this.formatCurrency(this.selectedFund.minimumContribution)} RSD.`;
    }
    return null;
  }

  get canInvest(): boolean {
    return (
      !!this.selectedFund &&
      !!this.selectedAccountNumber &&
      this.investAmount !== null &&
      this.investAmount > 0 &&
      this.investAmount >= this.selectedFund.minimumContribution &&
      !this.isInvesting
    );
  }

  confirmInvest(): void {
    if (!this.canInvest || !this.selectedFund) return;

    this.isInvesting = true;

    const request: InvestRequest = {
      fundId: this.selectedFund.id,
      accountNumber: this.selectedAccountNumber,
      amount: this.investAmount!,
    };

    this.fundService.invest(request).subscribe({
      next: () => {
        this.isInvesting = false;
        this.toastService.success(`Uspešno ste investirali ${this.formatCurrency(this.investAmount!)} RSD u fond "${this.selectedFund!.name}".`);
        this.closeInvestModal();
      },
      error: (err) => {
        this.isInvesting = false;
        this.toastService.error(err.error?.message || 'Greška pri investiranju.');
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatProfit(profit: number): string {
    const sign = profit >= 0 ? '+' : '';
    return `${sign}${profit.toFixed(2)}%`;
  }

  profitClass(profit: number): string {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  trackById(_: number, fund: Fund): number {
    return fund.id;
  }
}
