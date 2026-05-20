import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PortfolioService } from '../../services/portfolio.service';
import {
  DividendPayout,
  PortfolioHolding,
  PortfolioListingType,
  PortfolioSummary,
} from '../../models/portfolio.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { StateComponent } from '../../../../shared/components/state/state.component';
import { FundService } from '../../../funds/services/fund.service';
import { ClientFundPosition, InvestmentFund } from '../../../funds/models/fund.model';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StateComponent],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss'],
})
export class PortfolioComponent implements OnInit, OnDestroy {
  summary: PortfolioSummary | null = null;
  holdings: PortfolioHolding[] = [];
  isLoading = false;
  errorMessage = '';
  isActuary = false;

  draftPublicQuantities: Record<string, number> = {};
  savingPublicQuantity: Record<string, boolean> = {};
  exercisingOption: Record<string, boolean> = {};

  /** F10: prošireni red sa istorijom dividendi (samo STOCK). */
  dividendExpanded: Record<string, boolean> = {};
  dividendPayouts: Record<string, DividendPayout[]> = {};
  dividendTotals: Record<string, { amount: number; currency: string } | null> = {};
  dividendLoading: Record<string, boolean> = {};
  dividendError: Record<string, string> = {};

  activeTab: 'holdings' | 'funds' = 'holdings';
  isSupervisor = false;
  fundPositions: ClientFundPosition[] = [];
  supervisedFunds: InvestmentFund[] = [];
  fundsLoading = false;
  fundsError: string | null = null;
  fundsFetched = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly fundService: FundService,
  ) {}

  ngOnInit(): void {
    this.isActuary = this.authService.isActuary();
    this.isSupervisor = this.authService.hasPermission('FUND_AGENT_MANAGE');
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

  setTab(tab: 'holdings' | 'funds'): void {
    this.activeTab = tab;
    if (tab === 'funds' && !this.fundsFetched) {
      this.loadFunds();
    }
  }

  loadFunds(): void {
    this.fundsLoading = true;
    this.fundsError = null;
    const obs: any = this.isSupervisor
      ? this.fundService.supervised()
      : this.fundService.myPositions();
    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        if (this.isSupervisor) {
          this.supervisedFunds = data as InvestmentFund[];
        } else {
          this.fundPositions = data as ClientFundPosition[];
        }
        this.fundsLoading = false;
        this.fundsFetched = true;
      },
      error: (err: any) => {
        this.fundsError = err?.error?.message || 'Greska pri ucitavanju fondova.';
        this.fundsLoading = false;
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

  onSell(holding: PortfolioHolding): void {
    if (holding == null || holding.listingId == null) {
      this.toastService.error('Nedostaje listingId za izabranu poziciju.');
      return;
    }
    this.router.navigate(['/orders/create', 'SELL', holding.listingId]);
  }

  isStock(holding: PortfolioHolding): boolean {
    return holding.listingType === 'STOCK';
  }

  canShowDividendHistory(holding: PortfolioHolding): boolean {
    return this.isStock(holding);
  }

  isDividendExpanded(key: string): boolean {
    return !!this.dividendExpanded[key];
  }

  toggleDividendPanel(holding: PortfolioHolding, index: number): void {
    const key = this.getHoldingKey(holding, index);
    const next = !this.dividendExpanded[key];
    this.dividendExpanded[key] = next;

    if (next && this.dividendPayouts[key] === undefined) {
      this.loadDividendHistory(holding, index);
    }
  }

  loadDividendHistory(holding: PortfolioHolding, index: number): void {
    const key = this.getHoldingKey(holding, index);
    const portfolioId = holding.id;

    if (typeof portfolioId !== 'number') {
      this.dividendError[key] =
        'Istorija dividendi će biti dostupna kada backend vrati portfolio ID u listi pozicija.';
      return;
    }

    this.dividendLoading[key] = true;
    this.dividendError[key] = '';

    this.portfolioService
      .getDividendHistory(portfolioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const payouts = response.payouts ?? [];
          this.dividendPayouts[key] = payouts;
          this.dividendTotals[key] = this.resolveDividendTotal(response, payouts);
          this.dividendLoading[key] = false;
        },
        error: (error) => {
          console.error('Error loading dividend history:', error);
          this.dividendError[key] =
            'Greška pri učitavanju istorije dividendi. Pokušajte ponovo.';
          this.dividendLoading[key] = false;
        },
      });
  }

  getDividendTotalLabel(key: string): string | null {
    const total = this.dividendTotals[key];
    if (!total) return null;
    return `${this.formatAmount(total.amount)} ${total.currency}`;
  }

  formatPayoutDate(value: string): string {
    const raw = value?.includes('T') ? value.substring(0, 10) : value;
    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  formatMoney(amount: number, currency: string): string {
    return `${this.formatAmount(amount)} ${currency}`;
  }

  private resolveDividendTotal(
    response: { totalReceived?: number; currency?: string },
    payouts: DividendPayout[],
  ): { amount: number; currency: string } | null {
    if (payouts.length === 0 && response.totalReceived == null) {
      return null;
    }

    const currency =
      response.currency ??
      payouts[0]?.currency ??
      'RSD';

    if (response.totalReceived != null && Number.isFinite(response.totalReceived)) {
      return { amount: response.totalReceived, currency };
    }

    const amount = payouts.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    return { amount, currency };
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
