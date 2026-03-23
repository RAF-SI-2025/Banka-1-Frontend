import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Account } from '../../client/models/account.model';
import { AccountService } from '../../client/services/account.service';
import { ToastService } from '../../../shared/services/toast.service';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';

@Component({
  selector: 'app-account-management',
  templateUrl: './account-management.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  styleUrls: ['./account-management.component.scss']
})
export class AccountManagementComponent implements OnInit {
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];

  searchQuery = '';
  isLoading = false;

  showConfirmModal = false;
  selectedAccount: Account | null = null;

  constructor(
    private readonly accountService: AccountService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  private getLastName(fullName: string): string {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : parts[0].toLowerCase();
  }

  private sortByLastName(): void {
    this.accounts.sort((a, b) =>
      this.getLastName(a.ownerName || '').localeCompare(
        this.getLastName(b.ownerName || '')
      )
    );
  }

  private matchesOwnerPrefix(ownerName: string, query: string): boolean {
    if (!query) return true;
    if (!ownerName) return false;

    const parts = ownerName
      .toLowerCase()
      .trim()
      .split(/\s+/);

    return parts.some((part) => part.startsWith(query));
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.filteredAccounts = [...this.accounts];
      return;
    }

    const isAccountSearch = /\d/.test(query);

    this.filteredAccounts = this.accounts.filter((acc) => {
      if (isAccountSearch) {
        return (acc.accountNumber || '').toLowerCase().startsWith(query);
      }

      return this.matchesOwnerPrefix(acc.ownerName || '', query);
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  loadAccounts(): void {
    this.isLoading = true;

    this.accountService.getAllAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts || [];
        this.sortByLastName();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Greška pri učitavanju računa.');
      }
    });    
  }

  getOwnershipType(account: Account): string {
    const businessTypes = ['DOO', 'AD', 'FOUNDATION', 'FOREIGN_BUSINESS'];
    return businessTypes.includes(account.subtype) ? 'Poslovni' : 'Lični';
  }

  getAccountType(account: Account): string {
    const devizni = ['FOREIGN_PERSONAL', 'FOREIGN_BUSINESS'];
    return devizni.includes(account.subtype) ? 'Devizni' : 'Tekući';
  }

  getStatusLabel(status: Account['status']): string {
    if (status === 'ACTIVE') return 'Aktivan';
    if (status === 'INACTIVE') return 'Neaktivan';
    return status;
  }

  openConfirmModal(account: Account): void {
    this.selectedAccount = account;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedAccount = null;
  }

  confirmToggleAccountStatus(): void {
    if (!this.selectedAccount) return;

    const account = this.selectedAccount;
    const active = account.status === 'ACTIVE';
    const targetStatus = active ? 'INACTIVE' : 'ACTIVE';

    this.accountService
      .updateAccountStatus(account.id, targetStatus as 'ACTIVE' | 'INACTIVE')
      .subscribe({
        next: () => {
          account.status = targetStatus as Account['status'];
          this.applyFilters();

          this.toastService.success(
            `Račun je uspešno ${active ? 'deaktiviran' : 'aktiviran'}.`
          );

          this.closeConfirmModal();
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.error(
            err.error?.message ||
              `Greška pri ${active ? 'deaktivaciji' : 'aktivaciji'} računa.`
          );
          this.closeConfirmModal();
        }
      });
  }

  openAccountCards(account: Account): void {
    this.router.navigate(['/account-cards'], {
      queryParams: {
        accountNumber: account.accountNumber,
        ownerName: account.ownerName,
        ownershipType: this.getOwnershipType(account),
        accountType: this.getAccountType(account),
        status: this.getStatusLabel(account.status)
      }
    });
  }

  trackByAccount(index: number, account: Account): number {
    return account.id;
  }
}