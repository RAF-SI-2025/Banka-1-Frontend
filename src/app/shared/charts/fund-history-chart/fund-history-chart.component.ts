import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ApexAxisChartSeries, ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Subscription } from 'rxjs';

import { ThemeService } from '../../../core/services/theme.service';
import { buildPriceChartTheme, EffectiveTheme } from '../apex-theme';

export interface FundSeriesPoint { x: number | string | Date; y: number; }

/**
 * WP-26 (Celina 4 — statistika fondova): linijski chart koji prikazuje
 * istoriju vrednosti fonda i (opciono) sistemski prosek na istom grafiku.
 *
 * <p>`PriceChartComponent` podrzava samo jednu seriju. Umesto da ga
 * proboravimo invazivno, ovo je sibling komponenta koja reuse-uje isti
 * `buildPriceChartTheme()` builder (light/dark aware), ali render-uje 1-2
 * serije kao `type: 'line'` (bez gradient fill-a, da se dve linije ne
 * preklapaju vizuelno).
 */
@Component({
  selector: 'app-fund-history-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './fund-history-chart.component.html',
})
export class FundHistoryChartComponent implements OnInit, OnChanges, OnDestroy {
  /** Primarna serija — istorija vrednosti samog fonda. */
  @Input() fundSeries: FundSeriesPoint[] = [];
  /** Opciona serija — sistemski prosek svih fondova (comparison). */
  @Input() averageSeries: FundSeriesPoint[] | null = null;
  @Input() fundLabel = 'Fond';
  @Input() averageLabel = 'Prosek svih fondova';
  @Input() height = 320;

  options: Partial<ApexOptions> = {};
  apexSeries: ApexAxisChartSeries = [];
  private sub?: Subscription;
  private currentEffective: EffectiveTheme = 'light';

  constructor(private theme: ThemeService) {}

  ngOnInit(): void {
    this.refreshSeries();
    this.sub = this.theme.effective$.subscribe((eff) => {
      this.currentEffective = eff;
      this.options = this.buildOptions(eff);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fundSeries'] || changes['averageSeries'] || changes['fundLabel'] || changes['averageLabel']) {
      this.refreshSeries();
    }
    if (changes['height']) {
      this.options = this.buildOptions(this.currentEffective);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshSeries(): void {
    const series: ApexAxisChartSeries = [
      { name: this.fundLabel, data: this.fundSeries as any },
    ];
    if (this.averageSeries && this.averageSeries.length > 0) {
      series.push({ name: this.averageLabel, data: this.averageSeries as any });
    }
    this.apexSeries = series;
  }

  private buildOptions(eff: EffectiveTheme): Partial<ApexOptions> {
    const base = buildPriceChartTheme(eff);
    return {
      ...base,
      chart: { ...(base.chart || {}), type: 'line', height: this.height },
      // Line mode: bez gradient fill-a — dve linije bi se vizuelno preklapale.
      fill: { type: 'solid', opacity: 1 },
      stroke: { curve: 'smooth', width: 2.5 },
      // Comparison chart treba legendu da razlikuje fond od proseka.
      legend: { show: true, position: 'top', horizontalAlign: 'right' },
    };
  }
}
