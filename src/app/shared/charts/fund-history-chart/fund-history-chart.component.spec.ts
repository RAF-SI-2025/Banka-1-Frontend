import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { FundHistoryChartComponent, FundSeriesPoint } from './fund-history-chart.component';
import { ThemeService } from '../../../core/services/theme.service';

describe('FundHistoryChartComponent', () => {
  let component: FundHistoryChartComponent;
  let fixture: ComponentFixture<FundHistoryChartComponent>;

  const fundSeries: FundSeriesPoint[] = [
    { x: '2026-01-01', y: 100 },
    { x: '2026-02-01', y: 120 },
  ];
  const avgSeries: FundSeriesPoint[] = [
    { x: '2026-01-01', y: 90 },
    { x: '2026-02-01', y: 95 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FundHistoryChartComponent],
      providers: [ThemeService],
    });
    fixture = TestBed.createComponent(FundHistoryChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build a single series when no average series is given', () => {
    component.fundSeries = fundSeries;
    component.averageSeries = null;
    component.ngOnInit();

    expect(component.apexSeries.length).toBe(1);
    expect(component.apexSeries[0].name).toBe('Fond');
    expect(component.apexSeries[0].data).toEqual(fundSeries as any);
  });

  it('should add the average series when one is provided', () => {
    component.fundSeries = fundSeries;
    component.averageSeries = avgSeries;
    component.fundLabel = 'Moj fond';
    component.averageLabel = 'Prosek';
    component.ngOnInit();

    expect(component.apexSeries.length).toBe(2);
    expect(component.apexSeries[0].name).toBe('Moj fond');
    expect(component.apexSeries[1].name).toBe('Prosek');
  });

  it('should not add an empty average series', () => {
    component.fundSeries = fundSeries;
    component.averageSeries = [];
    component.ngOnInit();

    expect(component.apexSeries.length).toBe(1);
  });

  it('should build line-type options with a visible legend', () => {
    component.fundSeries = fundSeries;
    component.ngOnInit();

    expect(component.options.chart?.type).toBe('line');
    expect(component.options.legend?.show).toBeTrue();
  });

  it('should rebuild series on input changes', () => {
    component.fundSeries = fundSeries;
    component.ngOnInit();
    expect(component.apexSeries.length).toBe(1);

    component.averageSeries = avgSeries;
    component.ngOnChanges({
      averageSeries: new SimpleChange(null, avgSeries, false),
    });

    expect(component.apexSeries.length).toBe(2);
  });
});
