import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FundService } from '../../services/fund.service';
import {
  ClientFundPosition,
  FundHolding,
  FundStatistics,
  FundValueSnapshotPoint,
  InvestmentFund,
} from '../../models/fund.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AccountService } from '../../../client/services/account.service';
import { Account } from '../../../client/models/account.model';
import { FundSeriesPoint } from '../../../../shared/charts/fund-history-chart/fund-history-chart.component';

@Component({
  selector: 'app-fund-details',
  templateUrl: './fund-details.component.html',
})
export class FundDetailsComponent implements OnInit {
  fund: InvestmentFund | null = null;
  fundId!: number;
  loading = false;
  error: string | null = null;

  securities: FundHolding[] = [];
  positions: ClientFundPosition[] = [];
  myPosition: ClientFundPosition | null = null;

  // WP-26 (Celina 4 — statistika fondova): metrike + chart serije.
  statistics: FundStatistics | null = null;
  statisticsLoading = false;
  statisticsError = false;
  fundValueSeries: FundSeriesPoint[] = [];
  averageValueSeries: FundSeriesPoint[] = [];
  historyLoading = false;
  historyError = false;

  isSupervisor = false;
  isClient = false;
  clientAccounts: Account[] = [];

  sellTarget: FundHolding | null = null;
  sellQuantity: number | null = null;
  sellError: string | null = null;

  investForm: FormGroup;
  redeemForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fundService: FundService,
    private fb: FormBuilder,
    private authService: AuthService,
    private accountService: AccountService,
    public router: Router,
  ) {
    this.investForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      fromAccountNumber: ['', Validators.required],
    });
    this.redeemForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      toAccountNumber: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fundId = Number(this.route.snapshot.paramMap.get('id'));
    this.isSupervisor = this.authService.hasPermission('FUND_AGENT_MANAGE');
    this.isClient = this.authService.isClient();
    this.load();
    if (this.isClient) {
      this.accountService.getMyAccounts().subscribe({
        next: accounts => { this.clientAccounts = accounts.filter(a => a.status === 'ACTIVE' && a.currency === 'RSD'); },
        error: () => {},
      });
    }
  }

  load(): void {
    this.loading = true;
    this.error = null;

    const requests: any = { fund: this.fundService.details(this.fundId) };

    if (this.isSupervisor) {
      requests['positions'] = this.fundService.fundPositions(this.fundId);
    } else if (this.isClient) {
      requests['myPositions'] = this.fundService.myPositions();
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.fund = res['fund'];
        if (this.isSupervisor && res['positions']) {
          this.positions = res['positions'];
        }
        if (this.isClient && res['myPositions']) {
          this.myPosition = (res['myPositions'] as ClientFundPosition[])
            .find(p => p.fundId === this.fundId) ?? null;
        }
        this.loadSecurities();
        this.loadStatistics();
        this.loadValueHistory();
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju fonda.';
        this.loading = false;
      },
    });
  }

  private loadSecurities(): void {
    this.fundService.fundSecurities(this.fundId).subscribe({
      next: s => { this.securities = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  /** WP-26: ucitava performance metrike fonda. */
  private loadStatistics(): void {
    this.statisticsLoading = true;
    this.statisticsError = false;
    this.fundService.getStatistics(this.fundId).subscribe({
      next: stats => { this.statistics = stats; this.statisticsLoading = false; },
      error: () => { this.statisticsError = true; this.statisticsLoading = false; },
    });
  }

  /**
   * WP-26: ucitava istoriju vrednosti fonda i sistemski prosek paralelno.
   * Prosek je best-effort — `catchError` na average struji znaci da pad
   * proseka NE rusi chart; serija samog fonda se i dalje prikazuje (chart
   * onda nema comparison liniju). `historyError` se pali samo ako padne
   * realna istorija fonda.
   */
  private loadValueHistory(): void {
    this.historyLoading = true;
    this.historyError = false;
    forkJoin({
      fund: this.fundService.getValueHistory(this.fundId),
      average: this.fundService.getAverageValueHistory().pipe(
        catchError(() => of([] as FundValueSnapshotPoint[])),
      ),
    }).subscribe({
      next: ({ fund, average }) => {
        this.fundValueSeries = fund.map(p => this.toSeriesPoint(p));
        this.averageValueSeries = average.map(p => this.toSeriesPoint(p));
        this.historyLoading = false;
      },
      error: () => { this.historyError = true; this.historyLoading = false; },
    });
  }

  private toSeriesPoint(p: FundValueSnapshotPoint): FundSeriesPoint {
    return { x: p.snapshotDate, y: p.totalValue };
  }

  /** WP-26: true kad metrike postoje i ima ih smisla prikazati. */
  get hasMetrics(): boolean {
    return !!this.statistics && this.statistics.metricsAvailable;
  }

  /** WP-26: frakcija (0.12) -> procenat string; null -> placeholder. */
  metricPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${(value * 100).toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  /** WP-26: reward-to-variability ratio (ne procenat); null -> placeholder. */
  metricRatio(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return value.toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  openSell(holding: FundHolding): void {
    this.sellTarget = holding;
    this.sellQuantity = null;
    this.sellError = null;
  }

  closeSell(): void {
    this.sellTarget = null;
    this.sellQuantity = null;
    this.sellError = null;
  }

  confirmSell(): void {
    if (!this.sellTarget || !this.sellQuantity) return;
    this.fundService.sellSecurity(this.fundId, this.sellTarget.ticker, this.sellQuantity).subscribe({
      next: result => {
        this.closeSell();
        alert(`Prodato ${result.quantitySold} x ${result.ticker} po ${result.unitPrice}. Prihod: ${result.proceeds.toFixed(2)} RSD`);
        this.load();
      },
      error: err => { this.sellError = err?.error?.message || 'Greska pri prodaji.'; },
    });
  }

  onInvest(): void {
    if (this.investForm.invalid || !this.fund) return;
    const { amount } = this.investForm.value;
    if (amount < this.fund.minimumContribution) {
      this.error = `Iznos mora biti manji od minimalnog uloga fonda koji iznosi ${this.fund.minimumContribution.toFixed(2)} RSD.`;
      return;
    }
    this.fundService.invest(this.fundId, this.investForm.value).subscribe({
      next: () => {
        this.investForm.reset();
        this.error = null;
        this.load();
        alert('Uplata pokrenuta. Vasa pozicija ce biti azurirana nakon obrade transakcije.');
      },
      error: err => { this.error = err?.error?.message || 'Greska pri uplati.'; },
    });
  }

  onRedeem(): void {
    if (this.redeemForm.invalid || !this.fund) return;
    const { amount } = this.redeemForm.value;
    if (this.myPosition && amount > this.myPosition.currentPositionValue) {
      this.error = `Iznos veci od trenutne vrednosti pozicije (${this.myPosition.currentPositionValue.toFixed(2)} RSD).`;
      return;
    }
    const needsLiquidation = this.fund && amount > this.fund.likvidnaSredstva;
    this.fundService.redeem(this.fundId, this.redeemForm.value).subscribe({
      next: () => {
        this.redeemForm.reset();
        this.error = null;
        this.load();
        const msg = needsLiquidation
          ? 'Fond nema dovoljno likvidnih sredstava. Automatski ce se likvidirati potreban broj hartija. Isplatu cete primiti u kratkom roku.'
          : 'Isplata pokrenuta. Iznos ce biti prebacen na Vas racun.';
        alert(msg);
      },
      error: err => { this.error = err?.error?.message || 'Greska pri isplati.'; },
    });
  }

  positionInvestorLabel(p: ClientFundPosition): string {
    return p.clientId === -1 ? 'BANKA' : `Klijent #${p.clientId}`;
  }
}
