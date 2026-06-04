import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SecuritiesService } from '../../services/securities.service';
import {
  Stock,
  PriceHistory,
  OptionChain,
  StockOption,
} from '../../models/security.model';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../../../shared/components/state/state.component';
// PR_31 Phase 7 T23: ApexCharts zameni Canvas drawChart().
import { PriceChartComponent, PriceSeriesPoint } from '../../../../shared/charts/price-chart/price-chart.component';
import { PriceAlertModalComponent } from '../../../price-alerts/components/price-alert-modal/price-alert-modal.component';
import { SecurityForAlert } from '../../../price-alerts/models/price-alert.model';

type Period = 'day' | 'week' | 'month' | 'year' | '5year' | 'all';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, StateComponent, PriceChartComponent, PriceAlertModalComponent],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.scss'],
})
export class StockDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  ticker = '';
  stock: Stock | null = null;

  alertSecurity: SecurityForAlert | null = null;
  priceHistory: PriceHistory | null = null;
  optionChain: OptionChain | null = null;

  isLoading = true;
  errorMessage = '';

  /** PR_31 Phase 7 T23: ApexCharts serija (zameni Canvas drawChart). */
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

  // Options
  settlementDates: string[] = [];
  selectedSettlementDate = '';
  strikeCount = 10;
  displayedCalls: StockOption[] = [];
  displayedPuts: StockOption[] = [];
  displayedStrikes: number[] = [];
  /** PR_31 Phase 7 T23/T25: indeks strike-a sa minimalnom apsolutnom razlikom u
   * odnosu na spot price — ATM red dobija gold ring (z-option-atm-row). */
  atmIndex: number = -1;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.ticker = params['ticker'];
      this.loadStock();
    });

    // Auto-refresh every 60 seconds
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadPriceHistory());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStock(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadPriceHistory(true);
  }

  loadPriceHistory(initialLoad = false): void {
    this.securitiesService
      .getStockById(+this.ticker, this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) => {
          this.stock = this.applyPeriodStats(stock);
          this.buildDetailRows();
          this.priceHistory = {
            ticker: stock.ticker,
            period: this.selectedPeriod,
            data: stock.priceHistory ?? [],
          };
          // PR_31 Phase 7 T23: mapiraj priceHistory u ApexCharts seriju.
          this.priceSeries = (stock.priceHistory ?? []).map((p: any) => ({
            x: new Date(p.date ?? p.timestamp ?? p.datum),
            y: p.price ?? p.close ?? p.value
          }));
          this.isLoading = false;
          if (initialLoad) {
            this.loadSettlementDates();
          }
        },
        error: (err) => {
          console.error('Error loading stock:', err);
          this.errorMessage = 'Greška pri učitavanju akcije.';
          this.isLoading = false;
        },
      });
  }

  loadSettlementDates(): void {
    if (!this.stock) return;

    const groups = this.stock.optionGroups ?? [];
    this.settlementDates = groups
      .map((og: any) => og.settlementDate)
      .filter((d: string | null) => !!d)
      .sort();

    if (this.settlementDates.length > 0) {
      this.selectedSettlementDate = this.settlementDates[0];
      this.loadOptionChain();
    }
  }

  loadOptionChain(): void {
    if (!this.selectedSettlementDate || !this.stock) return;

    const groups = this.stock.optionGroups ?? [];
    const matching = groups.find((og: any) => og.settlementDate === this.selectedSettlementDate);

    if (!matching) {
      this.optionChain = null;
      this.updateDisplayedOptions();
      return;
    }

    const expiry = new Date(this.selectedSettlementDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const mapOption = (opt: any, type: 'CALL' | 'PUT') => ({
      strike: opt.strikePrice ?? opt.strike ?? 0,
      type,
      last: opt.last ?? 0,
      theta: opt.theta ?? 0,
      bid: opt.bid ?? 0,
      ask: opt.ask ?? 0,
      volume: opt.volume ?? 0,
      openInterest: opt.openInterest ?? 0,
      inTheMoney: opt.inTheMoney ?? false,
    });

    const calls = (matching.calls ?? []).map((o: any) => mapOption(o, 'CALL'));
    const puts  = (matching.puts  ?? []).map((o: any) => mapOption(o, 'PUT'));
    const strikes: number[] = [...new Set([
      ...calls.map((c: any) => c.strike),
      ...puts.map((p: any)  => p.strike),
    ])].sort((a: any, b: any) => a - b);

    this.optionChain = { settlementDate: matching.settlementDate, daysToExpiry, calls, puts, strikes };
    this.updateDisplayedOptions();
  }

  onSettlementDateChange(): void {
    this.loadOptionChain();
  }

  onStrikeCountChange(): void {
    this.updateDisplayedOptions();
  }

  updateDisplayedOptions(): void {
    if (!this.optionChain) return;

    const currentPrice = this.stock?.price ?? 0;
    const strikes = this.optionChain.strikes; // already sorted ascending

    const below = strikes.filter((s) => s <= currentPrice);
    const above = strikes.filter((s) => s > currentPrice);

    const selectedBelow = below.slice(-this.strikeCount);
    const selectedAbove = above.slice(0, this.strikeCount);

    this.displayedStrikes = [...selectedBelow, ...selectedAbove];

    this.displayedCalls = this.optionChain.calls.filter((c) =>
      this.displayedStrikes.includes(c.strike)
    );
    this.displayedPuts = this.optionChain.puts.filter((p) =>
      this.displayedStrikes.includes(p.strike)
    );

    // PR_31 Phase 7 T25: indeks ATM strike-a (najblizi spot ceni).
    this.atmIndex = this.computeAtmIndex(this.displayedStrikes, currentPrice);
  }

  /**
   * PR_31 Phase 7 T25: vrati indeks strike-a sa minimalnom apsolutnom razlikom
   * u odnosu na spot price. Vraca -1 ako nema strike-ova.
   */
  computeAtmIndex(strikes: number[], spot: number): number {
    if (!strikes || strikes.length === 0) return -1;
    let closestIdx = 0;
    let minDiff = Infinity;
    strikes.forEach((s, i) => {
      const d = Math.abs(s - spot);
      if (d < minDiff) { minDiff = d; closestIdx = i; }
    });
    return closestIdx;
  }

  applyPeriodStats(stock: Stock): Stock {
    const history = stock.priceHistory;
    if (!history || history.length <= 1) return stock;

    const first = history[0];
    const last = history[history.length - 1];
    const periodChange = last.price - first.price;
    const periodChangePercent = first.price !== 0 ? (periodChange / first.price) * 100 : 0;
    const totalVolume = history.reduce((sum, p) => sum + (p.volume ?? 0), 0);
    const totalDollarVolume = history.reduce((sum, p) => sum + (p.dollarVolume ?? 0), 0);

    return {
      ...stock,
      change: periodChange,
      changePercent: periodChangePercent,
      volume: totalVolume,
      dollarVolume: totalDollarVolume || stock.dollarVolume,
    };
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
    this.isLoading = true;
    this.loadPriceHistory();
  }

  buildDetailRows(): void {
    if (!this.stock) return;
    const s = this.stock;
    const history = s.priceHistory ?? [];

    const open     = history.length > 0 ? this.formatPrice(history[0].price) : '—';
    const high     = history.length > 0 ? this.formatPrice(Math.max(...history.map(p => p.price))) : '—';
    const low      = history.length > 0 ? this.formatPrice(Math.min(...history.map(p => p.price))) : '—';
    const prevClose = history.length > 1 ? this.formatPrice(history[history.length - 2].price) : '—';
    const marketCap = s.outstandingShares ? this.formatLargeNumber(s.outstandingShares * s.price) : '—';

    this.detailRows = [
      { label: 'Bid',                   value: this.formatPrice(s.bid) },
      { label: 'Ask',                   value: this.formatPrice(s.ask) },
      { label: 'Otvaranje',             value: open },
      { label: 'Najviša',               value: high },
      { label: 'Najniža',               value: low },
      { label: 'Prethodno zatvaranje',  value: prevClose },
      { label: 'Tržišna kapitalizacija',value: marketCap },
      { label: 'P/E odnos',             value: '—' },
      { label: 'Dividendni prinos',     value: s.dividendYield !== undefined ? (s.dividendYield * 100).toFixed(2) + '%' : '—' },
      { label: 'Dollar volumen',        value: s.dollarVolume !== undefined ? this.formatLargeNumber(s.dollarVolume) : '—' },
      { label: 'Akcije u opticaju',     value: s.outstandingShares !== undefined ? this.formatLargeNumber(s.outstandingShares) : '—' },
      { label: 'Veličina ugovora',      value: s.contractSize !== undefined ? s.contractSize.toString() : '—' }];
  }

  getCallByStrike(strike: number): StockOption | undefined {
    return this.displayedCalls.find((c) => c.strike === strike);
  }

  getPutByStrike(strike: number): StockOption | undefined {
    return this.displayedPuts.find((p) => p.strike === strike);
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

  formatLargeNumber(num: number): string {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toString();
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

  formatOptionPrice(price: number): string {
    return price.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/securities']);
  }

  openAlertModal(): void {
    if (!this.stock) return;
    this.alertSecurity = {
      id: this.stock.id,
      ticker: this.stock.ticker,
      name: this.stock.name,
      price: this.stock.price,
      change: this.stock.change,
      changePercent: this.stock.changePercent,
      currency: this.stock.currency,
    };
  }

  closeAlertModal(): void {
    this.alertSecurity = null;
  }

  trackByStrike(index: number, strike: number): number {
    return strike;
  }

  /**
   * F8: Buy option button click handler
   * TODO: When F1 (OrderModal) is implemented, open modal with prepopulated option data:
   *
   * onBuyOption(option: StockOption, type: 'CALL' | 'PUT'): void {
   *   // 1. Check after-hours status first (F11)
   *   this.exchangeService.checkAfterHoursByMicCode(this.stock.exchange).subscribe(status => {
   *     if (status.isAfterHours && status.message) {
   *       this.toastService.warning(status.message);
   *     }
   *
   *     // 2. Open order modal with prepopulated data
   *     this.dialog.open(OrderModalComponent, {
   *       data: {
   *         mode: 'BUY',
   *         securityType: 'OPTION',
   *         option: {
   *           type: type,
   *           strike: option.strike,
   *           bid: option.bid,
   *           ask: option.ask,
   *           settlementDate: this.selectedSettlementDate,
   *           underlyingStock: this.stock
   *         }
   *       }
   *     });
   *   });
   * }
   */
  /**
   * PR_05 C5.1: Buy option flow vise nije placeholder.
   *
   * Spec (Celina 3): kupovina opcije pokrece order kreiranje sa kontekstom za
   * underlying stock + strike + tip (CALL/PUT). Implementacija salje korisnika
   * na postojecu /orders/create rutu sa query parametrima koji se konzumiraju
   * u CreateOrderComponent.
   */
  onBuyOption(option: StockOption, type: 'CALL' | 'PUT'): void {
    if (!this.stock) {
      this.errorMessage = 'Akcija jos uvek nije ucitana — pokusajte ponovo.';
      return;
    }
    this.router.navigate(
      ['/orders/create', 'BUY', this.stock.id ?? this.ticker],
      {
        queryParams: {
          orderType: 'OPTION',
          optionType: type,
          strike: option.strike,
          bid: option.bid,
          ask: option.ask,
          settlementDate: this.selectedSettlementDate ?? null,
          underlyingTicker: this.ticker,
        },
      },
    );
  }
}
