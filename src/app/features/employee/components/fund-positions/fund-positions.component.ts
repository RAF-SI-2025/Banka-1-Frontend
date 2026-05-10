import { Component, OnInit } from '@angular/core';
import { FundPosition } from '../../models/fund-position';
import { FundService } from '../../services/fund.service';
import { AccountService } from '../../../client/services/account.service';

@Component({
  selector: 'app-fund-positions',
  templateUrl: './fund-positions.component.html',
  styleUrls: ['./fund-positions.component.scss']
})
export class FundPositionsComponent implements OnInit {
  fundPositions: FundPosition[] = [];
  isLoading = false;

  bankAccounts: string[] = [];
  selectedAccountByFundId: Record<number, string> = {};

  constructor(
    private fundService: FundService,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.loadFundPositions();
    this.loadBankAccounts();
  }

  loadFundPositions(): void {
    this.isLoading = true;

    this.fundService.getFundPositions().subscribe({
      next: (data) => {
        this.fundPositions = data;
        this.setDefaultAccounts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju pozicija fondova:', err);
        this.fundPositions = [];
        this.isLoading = false;
      }
    });
  }

  loadBankAccounts(): void {
    this.accountService.getBankAccountByCurrency('RSD').subscribe({
      next: (account) => {
        this.bankAccounts = account?.accountNumber ? [account.accountNumber] : [];
        this.setDefaultAccounts();
      },
      error: (err) => {
        console.error('Greška pri učitavanju bankinog računa:', err);
        this.bankAccounts = [];
      }
    });
  }

  private setDefaultAccounts(): void {
    this.fundPositions.forEach(fund => {
      this.selectedAccountByFundId[fund.id] = this.bankAccounts[0] ?? '';
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  openFundDetails(fund: FundPosition): void {
    console.log('Otvori F4 za fond:', fund.id);
  }

  deposit(fund: FundPosition): void {
    const accountNumber = this.selectedAccountByFundId[fund.id];

    this.fundService.deposit(fund.id, accountNumber).subscribe({
      next: () => console.log('Uplata uspešna za fond:', fund.id),
      error: (err) => console.error('Greška pri uplati:', err)
    });
  }

  withdraw(fund: FundPosition): void {
    const accountNumber = this.selectedAccountByFundId[fund.id];

    this.fundService.withdraw(fund.id, accountNumber).subscribe({
      next: () => console.log('Povlačenje uspešno za fond:', fund.id),
      error: (err) => console.error('Greška pri povlačenju:', err)
    });
  }
}