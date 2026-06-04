import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecuritiesService } from '../../services/securities.service';
import {
  Security,
  Future,
  Forex,
  PriceHistory,
} from '../../models/security.model';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../../../shared/components/state/state.component';
// PR_31 Phase 7 T24: ApexCharts zameni Canvas drawChart().
import { PriceChartComponent, PriceSeriesPoint } from '../../../../shared/charts/price-chart/price-chart.component';

type Period = 'day' | 'week' | 'month' | 'year' | '5year' | 'all';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-security-detail',
  standalone: true,
  imports: [CommonModule, StateComponent, PriceChartComponent],
  templateUrl: './security-detail.component.html',
  styleUrls: ['./security-detail.component.scss'],
})
export class SecurityDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  securityType: 'future' | 'forex' = 'future';
  id: number | null = null;

  security: Security | null = null;
  priceHistory: PriceHistory | null = null;
  isLoading = true;
  errorMessage = '';

  /** PR_31 Phase 7 T24: ApexCharts serija (zameni Canvas drawChart). */
  priceSeries: PriceSeriesPoint[] = [];

  selectedPeriod: Period = 'month';

  periods: { value: Period; label: string }[] = [
    { value: 'day', label: 'Dan' },
    { value: 'week', label: 'Nedelja' },
    { value: 'month', label: 'Mesec' },
    { value: 'year', label: 'Godina' },
    { value: '5year', label: '5 God' },
    { value: 'all', label: 'Početak' }];

  detailRows: DetailRow[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService
  ) {}

  ngOnInit(): void {
    this.securityType = this.route.snapshot.data['securityType'];
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      // Route still uses 'ticker' parameter name, but it now contains the id value
      this.id = params['ticker'] ? parseInt(params['ticker'], 10) : null;
      this.loadSecurity();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSecurity(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.id) {
      this.errorMessage = 'Greška pri učitavanju hartije od vrednosti.';
      this.isLoading = false;
      return;
    }

    const request$: Observable<Security> =
      this.securityType === 'future'
        ? this.securitiesService.getFutureById(this.id)
        : this.securitiesService.getForexById(this.id);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (security: Security) => {
        this.security = security;
        this.buildDetailRows();
        this.loadPriceHistory();
      },
      error: (err: Error) => {
        this.errorMessage = 'Greška pri učitavanju hartije od vrednosti.';
        this.isLoading = false;
      },
    });
  }

  loadPriceHistory(): void {
    if (!this.security || !this.id) return;

    this.securitiesService
      .getPriceHistory(this.id.toString(), this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          // If no historical data, use current price as fallback
          if (!history.data || history.data.length === 0) {
            history.data = [{
              date: new Date().toISOString(),
              price: this.security!.price,
              volume: this.security!.volume || 0
            }];
          }

          this.priceHistory = history;
          // PR_31 Phase 7 T24: mapiraj history u ApexCharts seriju.
          this.priceSeries = (history.data ?? []).map((p: any) => ({
            x: new Date(p.date ?? p.timestamp ?? p.datum),
            y: p.price ?? p.close ?? p.value
          }));
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading price history:', err);
          this.isLoading = false;
        },
      });
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
    this.loadPriceHistory();
  }

  buildDetailRows(): void {
    if (!this.security) return;

    if (this.securityType === 'future') {
      const future = this.security as Future;
      this.detailRows = [
        { label: 'Otvaranje', value: this.formatPrice(future.open) },
        { label: 'Najviša', value: this.formatPrice(future.high) },
        { label: 'Najniža', value: this.formatPrice(future.low) },
        { label: 'Prethodno zatvaranje', value: this.formatPrice(future.previousClose) },
        { label: 'Datum izmirenja', value: future.settlementDate },
        { label: 'Veličina ugovora', value: future.contractSize.toString() },
        { label: 'Otvoreni interes', value: this.formatVolume(future.openInterest) }];
    } else {
      const forex = this.security as Forex;
      this.detailRows = [
        { label: 'Otvaranje', value: this.formatPrice(forex.open) },
        { label: 'Najviša', value: this.formatPrice(forex.high) },
        { label: 'Najniža', value: this.formatPrice(forex.low) },
        { label: 'Prethodno zatvaranje', value: this.formatPrice(forex.previousClose) },
        { label: 'Bid', value: forex.bid.toFixed(4) },
        { label: 'Ask', value: forex.ask.toFixed(4) },
        { label: 'Spread', value: forex.spread.toFixed(4) }];
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatVolume(volume: number): string {
    return new Intl.NumberFormat('sr-RS').format(volume);
  }

  formatChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  goBack(): void {
    this.router.navigate(['/securities']);
  }
}
