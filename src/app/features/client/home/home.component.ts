
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../core/models/account.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;
  error = false;

  constructor(
    private authService: AuthService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = false;

    this.accountService.getMyAccounts().subscribe({
      next: (data: Account[]) => {
        this.accounts = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  get totalAvailableBalance(): number {
    let total = 0;
    for (const account of this.accounts) {
      total += account.availableBalance;
    }
    return total;
  }

  formatAmount(amount: number, currency: string = 'RSD'): string {
    const fixed = Math.round(amount * 100) / 100;
    const str = String(fixed);
    const dotIndex = str.indexOf('.');
    const intPart = dotIndex >= 0 ? str.slice(0, dotIndex) : str;
    const decPart = dotIndex >= 0 ? str.slice(dotIndex + 1).padEnd(2, '0') : '00';
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart} ${currency}`;
  }

  getBalancePercent(account: Account): number {
    if (account.balance === 0) return 0;
    const percent = (account.availableBalance / account.balance) * 100;
    if (percent > 100) return 100;
    if (percent < 0) return 0;
    return percent;
  }
}
