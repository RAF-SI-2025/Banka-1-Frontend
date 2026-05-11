import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { InvestmentFundService } from '../../services/investment-fund.service';
import {
  FundPerformancePeriod,
  FundPerformancePoint,
  FundSecurityHolding,
  InvestmentFundDetail,
} from '../../models/investment-fund.model';

@Component({
  selector: 'app-fund-detail',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './fund-detail.component.html',
  styleUrls: ['./fund-detail.component.scss'],
})
export class FundDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('performanceCanvas') performanceCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly destroy$ = new Subject<void>();

  fundId = 0;
  fund: InvestmentFundDetail | null = null;
  selectedPeriod: FundPerformancePeriod = 'monthly';
  performance: FundPerformancePoint[] = [];

  isLoading = true;
  isPerformanceLoading = false;
  errorMessage = '';
  sellingSecurity: Record<number, boolean> = {};

  readonly periods: { value: FundPerformancePeriod; label: string }[] = [
    { value: 'monthly', label: 'Mesečno' },
    { value: 'quarterly', label: 'Kvartalno' },
    { value: 'yearly', label: 'Godišnje' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly investmentFundService: InvestmentFundService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.fundId = Number(params['id']);
      this.loadFund();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.drawPerformanceChart(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFund(): void {
    if (!Number.isFinite(this.fundId) || this.fundId <= 0) {
      this.errorMessage = 'Fond nije pronađen.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.investmentFundService
      .getFundDetail(this.fundId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fund) => {
          this.fund = fund;
          this.performance = fund.performance?.[this.selectedPeriod] ?? [];
          this.isLoading = false;
          setTimeout(() => this.drawPerformanceChart(), 0);
        },
        error: (error) => {
          console.error('Error loading fund detail:', error);
          this.errorMessage = 'Greška pri učitavanju detalja fonda.';
          this.isLoading = false;
        },
      });
  }

  selectPeriod(period: FundPerformancePeriod): void {
    if (this.selectedPeriod === period) return;

    this.selectedPeriod = period;
    this.isPerformanceLoading = true;

    this.investmentFundService
      .getFundPerformance(this.fundId, period)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (performance) => {
          this.performance = performance;
          this.isPerformanceLoading = false;
          setTimeout(() => this.drawPerformanceChart(), 0);
        },
        error: (error) => {
          console.error('Error loading fund performance:', error);
          this.toastService.error('Greška pri učitavanju performansi fonda.');
          this.isPerformanceLoading = false;
        },
      });
  }

  sellSecurity(security: FundSecurityHolding): void {
    if (!this.fund) return;

    this.sellingSecurity[security.id] = true;

    this.investmentFundService
      .sellFundSecurity(this.fund.id, security.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Zahtev za prodaju hartije je poslat.');
          this.sellingSecurity[security.id] = false;
          this.loadFund();
        },
        error: () => {
          this.toastService.info('Backend endpoint za prodaju hartije iz fonda još nije dostupan.');
          this.sellingSecurity[security.id] = false;
        },
      });
  }

  get canSellFundSecurities(): boolean {
    const roles = this.authService.getJwtRoles();
    const storedRole = this.authService.getUserRole().toUpperCase();

    return roles.includes('SUPERVISOR')
      || roles.includes('ADMIN')
      || storedRole === 'SUPERVISOR'
      || storedRole === 'ADMIN';
  }

  drawPerformanceChart(): void {
    if (!this.performanceCanvas || this.performance.length === 0) return;

    const canvas = this.performanceCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = 44;
    const width = rect.width;
    const height = rect.height;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const values = this.performance.map((point) => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const value = maxValue - (valueRange / 4) * i;

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatCompact(value), padding - 8, y + 4);
    }

    const xStep = this.performance.length > 1
      ? chartWidth / (this.performance.length - 1)
      : 0;
    const getX = (index: number) => this.performance.length === 1
      ? padding + chartWidth / 2
      : padding + xStep * index;
    const getY = (value: number) => padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    ctx.beginPath();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    this.performance.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
    ctx.lineTo(getX(this.performance.length - 1), height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(21, 128, 61, 0.24)');
    gradient.addColorStop(1, 'rgba(21, 128, 61, 0.04)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    this.performance.forEach((point, index) => {
      const x = getX(index);
      const date = new Date(point.date);
      const label = Number.isNaN(date.getTime())
        ? point.date
        : date.toLocaleDateString('sr-RS', { month: 'short', year: '2-digit' });
      ctx.fillText(label, x, height - padding + 16);
    });
  }

  goBack(): void {
    this.router.navigate(['/securities']);
  }

  formatMoney(value: number | null | undefined): string {
    return `${new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0)} RSD`;
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('sr-RS').format(value ?? 0);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  getChangeClass(value: number): string {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  trackBySecurityId(index: number, security: FundSecurityHolding): number {
    return security.id;
  }

  trackByPerformanceDate(index: number, point: FundPerformancePoint): string {
    return point.date;
  }

  private formatCompact(value: number): string {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  }
}
