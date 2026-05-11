import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { PortfolioService } from '../../services/portfolio.service';
import {
  PortfolioHolding,
  PortfolioListingType,
  PortfolioSummary,
} from '../../models/portfolio.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

type PortfolioTab = 'securities' | 'funds';

export interface FundPosition {
  id: number;
  name: string;
  description: string;
  totalFundValue: number;
  ownershipPercentage: number;
  ownershipValue: number;
  investedAmount: number;
  liquidAssets: number;
}

export interface ManagedFund {
  id: number;
  name: string;
  description: string;
  totalValue: number;
  liquidity: number;
}


export interface BankAccount {
  id: number;
  accountNumber: string;
  balance: number;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})

export class PortfolioComponent implements OnInit, OnDestroy {
  summary: PortfolioSummary | null = null;
  holdings: PortfolioHolding[] = [];
  isLoading = false;
  errorMessage = '';
  isActuary = false;
  isClient = false;

  activeTab: PortfolioTab = 'securities';
  myFunds: FundPosition[] = [];

  managedFunds: ManagedFund[] = [];

  clientAccounts: BankAccount[] = [];

  selectedFund: FundPosition | null = null;
  showDepositModal = false;
  showWithdrawModal = false;

  selectedAccountId: number | null = null;
  transactionAmount: number = 0;
  isFullWithdrawal = false;
  

  draftPublicQuantities: Record<string, number> = {};
  savingPublicQuantity: Record<string, boolean> = {};
  exercisingOption: Record<string, boolean> = {};

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isActuary = this.authService.isActuary();
    this.isClient = this.authService.isClient();
    this.loadPortfolio();

    // The portfolio page is the natural landing spot after a buy/sell flow,
    // so re-fetch holdings whenever the user navigates back to it. Without
    // this, freshly settled positions only appear after a manual refresh.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => event.urlAfterRedirects.startsWith('/portfolio')),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.loadPortfolio());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

setActiveTab(tab: PortfolioTab): void {
    this.activeTab = tab;
    if (tab === 'funds') {
      if (this.isClient) {
        // Logika za klijenta 
      } else {
        // Logika za supervizora 
      }
    }
  }
  calculateFundProfit(fund: FundPosition): number {
    return fund.ownershipValue - fund.investedAmount;
  }

  openDepositModal(fund: FundPosition, event: Event): void {
    event.stopPropagation();
    this.selectedFund = fund;
    this.showDepositModal = true;
    this.resetFundForm();
  }

  openWithdrawModal(fund: FundPosition, event: Event): void {
    event.stopPropagation();
    this.selectedFund = fund;
    this.showWithdrawModal = true;
    this.resetFundForm();
  }

  closeModals(): void {
    this.showDepositModal = false;
    this.showWithdrawModal = false;
    this.selectedFund = null;
  }

  resetFundForm(): void {
    this.selectedAccountId = null;
    this.transactionAmount = 0;
    this.isFullWithdrawal = false;
  }

  toggleFullWithdrawal(checked: boolean): void {
    this.isFullWithdrawal = checked;
    if (checked && this.selectedFund) {
      this.transactionAmount = this.selectedFund.ownershipValue;
    } else {
      this.transactionAmount = 0;
    }
  }

  get isLiquidityLow(): boolean {
    if (!this.selectedFund) return false;
    return this.transactionAmount > this.selectedFund.liquidAssets;
  }

  confirmDeposit(): void {
    // TODO: Connect to fund-service
    this.toastService.success('Uplata uspešno procesuirana.');
    this.closeModals();
  }

  confirmWithdrawal(): void {
    if (this.isLiquidityLow) {
      this.toastService.info('Fond nema dovoljno likvidnih sredstava. Isplata će biti izvršena nakon likvidacije hartija.');
    } else {
      this.toastService.success('Zahtev za povlačenje sredstava je podnet.');
    }
    this.closeModals();
  }

  navigateToFundDetails(fundId: number): void {
    this.router.navigate(['/funds', fundId]); //Ovo treba da se doupini kada se implemenitra F4
  }

  loadPortfolio(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.portfolioService
      .getPortfolio()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.holdings = summary.holdings ?? [];
          this.draftPublicQuantities = {};

          this.holdings.forEach((holding, index) => {
            this.draftPublicQuantities[this.getHoldingKey(holding, index)] =
              holding.publicQuantity ?? 0;
          });

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading portfolio:', error);
          this.errorMessage =
            'Gre�ka pri ucitavanju portfolija. Pokušajte ponovo.';
          this.isLoading = false;
        },
      });
  }

  getHoldingKey(holding: PortfolioHolding, index: number): string {
    return `${holding.ticker}-${holding.listingType}-${index}`;
  }

  hasPortfolioActionId(holding: PortfolioHolding): boolean {
    return typeof holding.id === 'number';
  }

  savePublicQuantity(holding: PortfolioHolding, index: number): void {
    const key = this.getHoldingKey(holding, index);
    const value = Number(this.draftPublicQuantities[key] ?? 0);
    const holdingId = holding.id;

    if (typeof holdingId !== 'number') {
      this.toastService.info('Backend trenutno ne vraca portfolio ID, pa ova akcija još nije dostupna.');
      return;
    }

    if (!Number.isFinite(value) || value < 0) {
      this.toastService.error('Javna kolicina mora biti 0 ili veca.');
      return;
    }

    if (value > holding.quantity) {
      this.toastService.error('Javna kolicina ne može biti veca od ukupne kolicine.');
      return;
    }

    this.savingPublicQuantity[key] = true;

    this.portfolioService
      .setPublicQuantity(holdingId, { publicQuantity: value })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Javna kolicina je uspešno ažurirana.');
          holding.publicQuantity = value;
          this.draftPublicQuantities[key] = value;
          this.savingPublicQuantity[key] = false;
        },
        error: (error) => {
          console.error('Error saving public quantity:', error);
          this.toastService.error('Nije moguce sacuvati javnu kolicinu.');
          this.savingPublicQuantity[key] = false;
          this.draftPublicQuantities[key] = holding.publicQuantity ?? 0;
        },
      });
  }

  exerciseOption(holding: PortfolioHolding, index: number): void {
    const key = this.getHoldingKey(holding, index);
    const holdingId = holding.id;

    if (typeof holdingId !== 'number') {
      this.toastService.info('Backend trenutno ne vraca portfolio ID, pa ova akcija još nije dostupna.');
      return;
    }

    this.exercisingOption[key] = true;

    this.portfolioService
      .exerciseOption(holdingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Opcija je uspešno iskorišćena.');
          this.loadPortfolio();
        },
        error: (error) => {
          console.error('Error exercising option:', error);
          this.toastService.error('Nije moguce iskoristiti opciju.');
          this.exercisingOption[key] = false;
        },
      });
  }

  onSell(): void {
    // TODO: Povezati F1 Sell modal / Create order flow kada ta implementacija bude dostupna.
  }

  isStock(holding: PortfolioHolding): boolean {
    return holding.listingType === 'STOCK';
  }

  isOption(holding: PortfolioHolding): boolean {
    return holding.listingType === 'OPTION';
  }

  canExerciseOption(holding: PortfolioHolding): boolean {
    return this.isActuary && this.isOption(holding) && holding.exercisable === true;
  }

  getTypeLabel(type: PortfolioListingType): string {
    const labels: Record<PortfolioListingType, string> = {
      STOCK: 'Akcija',
      FUTURES: 'Fjucers',
      FOREX: 'Forex',
      OPTION: 'Opcija',
    };

    return labels[type] ?? type;
  }

  formatAmount(value: number | null | undefined, digits = 2): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value ?? 0);
  }

  formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  getProfitClass(value: number): string {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  trackByHolding = (index: number, holding: PortfolioHolding): string => {
    return this.getHoldingKey(holding, index);
  }
}
