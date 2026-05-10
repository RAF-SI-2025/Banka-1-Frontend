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
    // The Create Order route is parameterised by direction and the underlying
    // listing id; without listingId the SELL flow cannot identify which
    // security the form should pre-select.
    if (typeof holding.listingId !== 'number') {
      this.toastService.error('Nije moguce otvoriti formu za prodaju: nedostaje identifikator hartije.');
      return;
    }
    this.router.navigate(['/orders/create', 'SELL', holding.listingId]);
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
