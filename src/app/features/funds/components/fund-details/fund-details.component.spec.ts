import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { FundDetailsComponent } from './fund-details.component';
import { FundService } from '../../services/fund.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AccountService } from '../../../client/services/account.service';
import { StateComponent } from '../../../../shared/components/state/state.component';
import {
  FundStatistics,
  FundValueSnapshotPoint,
  InvestmentFund,
} from '../../models/fund.model';

/**
 * Stub za `app-fund-history-chart` (WP-26). Deli isti selektor kao stvarni
 * `FundHistoryChartComponent` pa zamenjuje ApexCharts wrapper u testu —
 * spec ostaje deterministican u headless Chrome okruzenju i ne mora da
 * inicijalizuje stvarnu chart biblioteku.
 */
@Component({ selector: 'app-fund-history-chart', standalone: true, template: '' })
class FundHistoryChartStub {
  @Input() fundSeries: unknown;
  @Input() averageSeries: unknown;
  @Input() fundLabel: unknown;
  @Input() averageLabel: unknown;
  @Input() height: unknown;
}

describe('FundDetailsComponent', () => {
  let component: FundDetailsComponent;
  let fixture: ComponentFixture<FundDetailsComponent>;
  let fundServiceSpy: jasmine.SpyObj<FundService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  const fund: InvestmentFund = {
    id: 7,
    naziv: 'Test Fond',
    opis: 'opis',
    minimumContribution: 1000,
    managerId: 1,
    likvidnaSredstva: 5000,
    accountNumber: '111',
    datumKreiranja: '2026-01-01',
    totalValue: 10000,
    profit: 500,
    annualizedReturn: 0.12,
    rewardToVariability: 1.4,
    maxDrawdown: -0.08,
    volatility: 0.06,
  };

  const statsAvailable: FundStatistics = {
    metricsAvailable: true,
    annualizedReturn: 0.12,
    rewardToVariability: 1.4,
    maxDrawdown: -0.08,
    volatility: 0.06,
  };

  const statsUnavailable: FundStatistics = {
    metricsAvailable: false,
    annualizedReturn: null,
    rewardToVariability: null,
    maxDrawdown: null,
    volatility: null,
  };

  const history: FundValueSnapshotPoint[] = [
    { snapshotDate: '2026-01-01', totalValue: 1000, profit: 0 },
    { snapshotDate: '2026-02-01', totalValue: 1100, profit: 100 },
  ];

  const average: FundValueSnapshotPoint[] = [
    { snapshotDate: '2026-01-01', totalValue: 900, profit: 0 },
    { snapshotDate: '2026-02-01', totalValue: 950, profit: 50 },
  ];

  function setup(): void {
    fixture = TestBed.createComponent(FundDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    fundServiceSpy = jasmine.createSpyObj<FundService>('FundService', [
      'details', 'fundSecurities', 'fundPositions', 'myPositions',
      'getStatistics', 'getValueHistory', 'getAverageValueHistory',
    ]);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission', 'isClient']);
    accountServiceSpy = jasmine.createSpyObj<AccountService>('AccountService', ['getMyAccounts']);

    fundServiceSpy.details.and.returnValue(of(fund));
    fundServiceSpy.fundSecurities.and.returnValue(of([]));
    fundServiceSpy.fundPositions.and.returnValue(of([]));
    fundServiceSpy.myPositions.and.returnValue(of([]));
    fundServiceSpy.getStatistics.and.returnValue(of(statsAvailable));
    fundServiceSpy.getValueHistory.and.returnValue(of(history));
    fundServiceSpy.getAverageValueHistory.and.returnValue(of(average));
    authServiceSpy.hasPermission.and.returnValue(false);
    authServiceSpy.isClient.and.returnValue(false);
    accountServiceSpy.getMyAccounts.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [FundDetailsComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, StateComponent, FundHistoryChartStub],
      providers: [
        { provide: FundService, useValue: fundServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
      ],
    });
  });

  it('should create and load the fund', () => {
    setup();
    expect(component).toBeTruthy();
    expect(component.fund?.id).toBe(7);
  });

  describe('statistics panel', () => {
    it('should load statistics on init', () => {
      setup();
      expect(fundServiceSpy.getStatistics).toHaveBeenCalledWith(7);
      expect(component.statistics).toEqual(statsAvailable);
      expect(component.hasMetrics).toBeTrue();
    });

    it('should render the 4 metric stat cards when metrics are available', () => {
      setup();
      const grid: HTMLElement | null = fixture.nativeElement.querySelector('[data-testid="metrics-grid"]');
      expect(grid).not.toBeNull();
      expect(grid!.querySelector('[data-testid="stat-annualizedReturn"]')!.textContent).toContain('%');
      expect(grid!.querySelector('[data-testid="stat-rewardToVariability"]')!.textContent!.trim()).toBe('1,40');
      expect(grid!.querySelector('[data-testid="stat-maxDrawdown"]')!.textContent).toContain('%');
      expect(grid!.querySelector('[data-testid="stat-volatility"]')!.textContent).toContain('%');
    });

    it('should show the "not enough data" callout when metricsAvailable is false', () => {
      fundServiceSpy.getStatistics.and.returnValue(of(statsUnavailable));
      setup();

      expect(component.hasMetrics).toBeFalse();
      const callout: HTMLElement | null =
        fixture.nativeElement.querySelector('[data-testid="metrics-unavailable"]');
      expect(callout).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="metrics-grid"]')).toBeNull();
    });

    it('should flag a statistics error when the request fails', () => {
      fundServiceSpy.getStatistics.and.returnValue(throwError(() => new Error('stats failed')));
      setup();

      expect(component.statisticsError).toBeTrue();
      expect(component.statisticsLoading).toBeFalse();
    });
  });

  describe('value-history chart', () => {
    it('should load the fund and average series on init', () => {
      setup();
      expect(fundServiceSpy.getValueHistory).toHaveBeenCalledWith(7);
      expect(fundServiceSpy.getAverageValueHistory).toHaveBeenCalled();
      expect(component.fundValueSeries.length).toBe(2);
      expect(component.averageValueSeries.length).toBe(2);
      expect(component.fundValueSeries[0]).toEqual({ x: '2026-01-01', y: 1000 });
    });

    it('should render the chart when there is history', () => {
      setup();
      expect(fixture.nativeElement.querySelector('[data-testid="history-chart"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="history-empty"]')).toBeNull();
    });

    it('should show the empty callout when the fund has no history', () => {
      fundServiceSpy.getValueHistory.and.returnValue(of([]));
      setup();

      expect(component.fundValueSeries.length).toBe(0);
      expect(fixture.nativeElement.querySelector('[data-testid="history-empty"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="history-chart"]')).toBeNull();
    });

    it('should still render the fund series when only the average request fails', () => {
      fundServiceSpy.getAverageValueHistory.and.returnValue(throwError(() => new Error('avg failed')));
      setup();

      // Average is best-effort (catchError) -> fund line still loads, no error.
      expect(component.historyError).toBeFalse();
      expect(component.fundValueSeries.length).toBe(2);
      expect(component.averageValueSeries.length).toBe(0);
      expect(fixture.nativeElement.querySelector('[data-testid="history-chart"]')).not.toBeNull();
    });

    it('should flag a history error when the fund value-history request fails', () => {
      fundServiceSpy.getValueHistory.and.returnValue(throwError(() => new Error('history failed')));
      setup();

      expect(component.historyError).toBeTrue();
      expect(component.historyLoading).toBeFalse();
    });
  });

  describe('metric formatting helpers', () => {
    beforeEach(() => setup());

    it('metricPercent renders fraction as percentage', () => {
      expect(component.metricPercent(0.085)).toContain('8,50');
    });

    it('metricPercent renders "—" for null/undefined', () => {
      expect(component.metricPercent(null)).toBe('—');
      expect(component.metricPercent(undefined)).toBe('—');
    });

    it('metricRatio renders 2-decimal ratio', () => {
      expect(component.metricRatio(2)).toBe('2,00');
    });

    it('metricRatio renders "—" for null', () => {
      expect(component.metricRatio(null)).toBe('—');
    });
  });
});
