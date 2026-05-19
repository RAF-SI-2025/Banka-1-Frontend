import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as ApexCharts from 'apexcharts';
import { FundService } from '../../services/fund.service';
import { ClientFundPosition, FundHolding, InvestmentFund } from '../../models/fund.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AccountService } from '../../../client/services/account.service';
import { Account } from '../../../client/models/account.model';

type ChartPeriod = '1M' | '3M' | '1Y' | 'ALL';

@Component({
  selector: 'app-fund-details',
  templateUrl: './fund-details.component.html',
})
export class FundDetailsComponent implements OnInit {
  @ViewChild('historyChart') historyChartCanvas!: ElementRef;
  @ViewChild('comparisonChart') comparisonChartCanvas!: ElementRef;

  fund: InvestmentFund | null = null;
  fundId!: number;
  loading = false;
  error: string | null = null;

  securities: FundHolding[] = [];
  positions: ClientFundPosition[] = [];
  myPosition: ClientFundPosition | null = null;

  isSupervisor = false;
  isClient = false;
  clientAccounts: Account[] = [];

  sellTarget: FundHolding | null = null;
  sellQuantity: number | null = null;
  sellError: string | null = null;

  selectedPeriod: ChartPeriod = '3M';
  historyChartInstance: ApexCharts | null = null;
  comparisonChartInstance: ApexCharts | null = null;

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
        this.loadCharts(); 
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju fonda.';
        this.loading = false;
      },
    });
  }

  setPeriod(period: ChartPeriod): void {
    this.selectedPeriod = period;
    this.loadCharts();
  }

  loadCharts(): void {
      this.fundService.getFundHistory(this.fundId, this.selectedPeriod).subscribe({
        next: (data: any) => {
          this.renderHistoryChart(data.labels, data.values);
          this.renderComparisonChart(data.labels, data.fundPerformances, data.systemAveragePerformances);
        },
        error: err => {
          console.error('Nije moguće ucitati istoriju za grafikone:', err);
          // Ako nema podataka sa bekenda, grafikoni se jednostavno nece iscrtati sa pogresnim podacima
        }
      });
    }

  private triggerMockCharts(): void {
    const mockLabels = this.getMockLabels(this.selectedPeriod);
    const baseValue = this.fund?.totalValue || 5000000;
    
    const mockValues = [
      baseValue * 0.92,
      baseValue * 0.95,
      baseValue * 0.98,
      baseValue * 0.97,
      baseValue * 0.99,
      baseValue
    ];
    this.renderHistoryChart(mockLabels, mockValues);
    this.renderComparisonChart(mockLabels, [0, 2.5, 4.1, 3.8, 6.2, 8.5], [0, 1.8, 3.0, 3.5, 4.8, 5.2]);
  }

  private renderHistoryChart(labels: string[], values: number[]): void {
    if (this.historyChartInstance) this.historyChartInstance.destroy();
    
    setTimeout(() => {
      if (!this.historyChartCanvas) return;
      
      const options = {
        chart: {
          type: 'area',
          height: 250,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        colors: ['#d97706'],
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
        series: [{
          name: 'Vrednost fonda (RSD)',
          data: values
        }],
        xaxis: { 
          categories: labels,
          labels: {
            style: {
              colors: '#ffffff' 
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#ffffff'
            },
            formatter: (val: number) => val.toLocaleString('sr-RS') + ' RSD'
          }
        },
        legend: {
          labels: {
            colors: '#ffffff'
          }
        },
        tooltip: { theme: 'dark' }
      };

      this.historyChartInstance = new (ApexCharts as any)(this.historyChartCanvas.nativeElement!, options);
      this.historyChartInstance?.render();
    }, 50);
  }

  private renderComparisonChart(labels: string[], fundPerf: number[], systemAvg: number[]): void {
    if (this.comparisonChartInstance) this.comparisonChartInstance.destroy();
    
    setTimeout(() => {
      if (!this.comparisonChartCanvas) return;
      
      const options = {
        chart: {
          type: 'line',
          height: 250,
          toolbar: { show: false },
          fontFamily: 'Inter, sans-serif'
        },
        colors: ['#3b82f6', '#94a3b8'],
        stroke: {
          curve: 'smooth',
          width: [2, 2],
          dashArray: [0, 5]
        },
        dataLabels: { enabled: false },
        series: [
          { name: 'Ovaj fond (%)', data: fundPerf },
          { name: 'Prosek svih fondova (%)', data: systemAvg }
        ],
        xaxis: { 
          categories: labels,
          labels: {
            style: {
              colors: '#ffffff' 
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#ffffff'
            },
            formatter: (val: number) => val.toFixed(2) + '%'
          }
        },
        legend: {
          labels: {
            colors: '#ffffff' 
          }
        },
        tooltip: { theme: 'dark' }
      };

      this.comparisonChartInstance = new (ApexCharts as any)(this.comparisonChartCanvas.nativeElement!, options);
      this.comparisonChartInstance?.render();
    }, 50);
  }

  private getMockLabels(period: ChartPeriod): string[] {
    if (period === '1M') return ['Pre 4w', 'Pre 3w', 'Pre 2w', 'Pre 1w', 'Ove nedelje'];
    if (period === '3M') return ['Mart', 'April', 'Maj'];
    if (period === '1Y') return ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj'];
    return ['2023', '2024', '2025', '2026'];
  }

  private loadSecurities(): void {
    this.fundService.fundSecurities(this.fundId).subscribe({
      next: s => { this.securities = s; this.loading = false; },
      error: () => { this.loading = false; },
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