import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import ApexCharts from 'apexcharts';
import { Subscription } from 'rxjs';

import { ThemeService } from '../../../core/services/theme.service';
import { buildPriceChartTheme, EffectiveTheme } from '../apex-theme';

export interface PriceSeriesPoint { x: number | string | Date; y: number; }

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-chart.component.html',
})
export class PriceChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @Input() series: PriceSeriesPoint[] = [];
  @Input() label = 'Cena';
  @Input() height = 320;
  @Input() type: 'area' | 'line' = 'area';

  private chart?: ApexCharts;
  private sub?: Subscription;
  private currentEffective: EffectiveTheme = 'light';

  constructor(private theme: ThemeService) {}

  ngOnInit(): void {
    this.sub = this.theme.effective$.subscribe((eff) => {
      this.currentEffective = eff;
      this.renderChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['series'] || changes['label'] || changes['height'] || changes['type'])) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  private renderChart(): void {
    if (!this.chartContainer) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    const options = this.buildChartOptions();
    this.chart = new ApexCharts(this.chartContainer.nativeElement, options);
    this.chart.render();
  }

  private buildChartOptions(): ApexCharts.ApexOptions {
    const themeOptions = buildPriceChartTheme(this.currentEffective);
    return {
      ...themeOptions,
      chart: { ...(themeOptions['chart'] || {}), type: this.type as any, height: this.height },
      series: [{ name: this.label, data: this.series.map(p => ({ x: p.x, y: p.y })) }],
    } as ApexCharts.ApexOptions;
  }
}