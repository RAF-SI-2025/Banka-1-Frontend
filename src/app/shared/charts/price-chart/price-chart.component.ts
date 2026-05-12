import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ApexAxisChartSeries, ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Subscription } from 'rxjs';

import { ThemeService } from '../../../core/services/theme.service';
import { buildPriceChartTheme, EffectiveTheme } from '../apex-theme';

export interface PriceSeriesPoint { x: number | string | Date; y: number; }

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './price-chart.component.html',
})
export class PriceChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() series: PriceSeriesPoint[] = [];
  @Input() label = 'Cena';
  @Input() height = 320;
  @Input() type: 'area' | 'line' = 'area';

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
    if (changes['series'] || changes['label']) this.refreshSeries();
    if (changes['height'] || changes['type']) {
      this.options = this.buildOptions(this.currentEffective);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private refreshSeries(): void {
    this.apexSeries = [{ name: this.label, data: this.series as any }];
  }

  private buildOptions(eff: EffectiveTheme): Partial<ApexOptions> {
    const base = buildPriceChartTheme(eff);
    return {
      ...base,
      chart: { ...(base.chart || {}), type: this.type, height: this.height },
    };
  }
}
