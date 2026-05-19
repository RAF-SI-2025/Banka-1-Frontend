import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { FundDiscoveryComponent } from './fund-discovery.component';
import { FundService } from '../../services/fund.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StateComponent } from '../../../../shared/components/state/state.component';
import { InvestmentFund } from '../../models/fund.model';

describe('FundDiscoveryComponent', () => {
  let component: FundDiscoveryComponent;
  let fixture: ComponentFixture<FundDiscoveryComponent>;
  let fundServiceSpy: jasmine.SpyObj<FundService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const buildFund = (over: Partial<InvestmentFund>): InvestmentFund => ({
    id: 1,
    naziv: 'Fond',
    opis: '',
    minimumContribution: 1000,
    managerId: 1,
    likvidnaSredstva: 5000,
    accountNumber: '111',
    datumKreiranja: '2026-01-01',
    totalValue: 10000,
    profit: 0,
    annualizedReturn: null,
    rewardToVariability: null,
    maxDrawdown: null,
    volatility: null,
    ...over,
  });

  const buildFunds = (): InvestmentFund[] => [
    buildFund({ id: 1, naziv: 'Alfa', annualizedReturn: 0.05, rewardToVariability: 1.1, maxDrawdown: -0.04, volatility: 0.07 }),
    buildFund({ id: 2, naziv: 'Beta', annualizedReturn: 0.18, rewardToVariability: 2.2, maxDrawdown: -0.02, volatility: 0.03 }),
    buildFund({ id: 3, naziv: 'Gama', annualizedReturn: null, rewardToVariability: null, maxDrawdown: null, volatility: null }),
  ];

  function setup(funds: InvestmentFund[] = buildFunds()): void {
    fundServiceSpy.discovery.and.returnValue(of(funds));
    fixture = TestBed.createComponent(FundDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    fundServiceSpy = jasmine.createSpyObj<FundService>('FundService', ['discovery']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);
    authServiceSpy.hasPermission.and.returnValue(false);

    TestBed.configureTestingModule({
      declarations: [FundDiscoveryComponent],
      imports: [FormsModule, RouterTestingModule, StateComponent],
      providers: [
        { provide: FundService, useValue: fundServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
  });

  it('should create and load funds', () => {
    setup();
    expect(component).toBeTruthy();
    expect(fundServiceSpy.discovery).toHaveBeenCalled();
    expect(component.funds.length).toBe(3);
  });

  it('should render the 4 metric values on each card', () => {
    setup();
    const cards: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="fund-metrics"]');
    expect(cards.length).toBe(3);

    // First sorted card is "Alfa" (sortField defaults to naziv asc).
    const alfa = cards[0];
    expect(alfa.querySelector('[data-testid="metric-annualizedReturn"]')!.textContent).toContain('%');
    expect(alfa.querySelector('[data-testid="metric-rewardToVariability"]')!.textContent!.trim()).toBe('1,10');
    expect(alfa.querySelector('[data-testid="metric-maxDrawdown"]')!.textContent).toContain('%');
    expect(alfa.querySelector('[data-testid="metric-volatility"]')!.textContent).toContain('%');
  });

  it('should show a "—" placeholder for funds without metrics', () => {
    setup();
    // Card index 2 = "Gama" (null metrics).
    const cards: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="fund-metrics"]');
    const gama = cards[2];
    expect(gama.querySelector('[data-testid="metric-annualizedReturn"]')!.textContent!.trim()).toBe('—');
    expect(gama.querySelector('[data-testid="metric-rewardToVariability"]')!.textContent!.trim()).toBe('—');
  });

  it('should render the "not enough data" hint only for null-metric funds', () => {
    setup();
    const hints: HTMLElement[] = fixture.nativeElement.querySelectorAll('[data-testid="metric-empty-hint"]');
    expect(hints.length).toBe(1);
  });

  describe('sorting by metrics', () => {
    it('should sort ascending by annualizedReturn with null funds last', () => {
      setup();
      component.setSort('annualizedReturn');

      expect(component.sortField).toBe('annualizedReturn');
      expect(component.sortDir).toBe('asc');
      // 0.05 (Alfa), 0.18 (Beta), null (Gama) — null last.
      expect(component.funds.map(f => f.id)).toEqual([1, 2, 3]);
    });

    it('should keep null-metric funds last even when descending', () => {
      setup();
      component.setSort('annualizedReturn'); // asc
      component.setSort('annualizedReturn'); // toggles to desc

      expect(component.sortDir).toBe('desc');
      // 0.18 (Beta), 0.05 (Alfa), null (Gama) — null STILL last.
      expect(component.funds.map(f => f.id)).toEqual([2, 1, 3]);
    });

    it('should sort by volatility ascending with null funds last', () => {
      setup();
      component.setSort('volatility');

      // 0.03 (Beta), 0.07 (Alfa), null (Gama).
      expect(component.funds.map(f => f.id)).toEqual([2, 1, 3]);
    });

    it('should sort by rewardToVariability with null funds last', () => {
      setup();
      component.setSort('rewardToVariability');

      // 1.1 (Alfa), 2.2 (Beta), null (Gama).
      expect(component.funds.map(f => f.id)).toEqual([1, 2, 3]);
    });

    it('should still sort plain fields normally (no null-last special case)', () => {
      setup();
      // sortField defaults to 'naziv' asc -> a single setSort('naziv') toggles to desc.
      component.setSort('naziv');

      expect(component.sortDir).toBe('desc');
      expect(component.funds.map(f => f.naziv)).toEqual(['Gama', 'Beta', 'Alfa']);
    });
  });

  describe('metric formatting helpers', () => {
    beforeEach(() => setup());

    it('metricPercent should render a fraction as a percentage', () => {
      expect(component.metricPercent(0.1234)).toContain('12,34');
      expect(component.metricPercent(0.1234)).toContain('%');
    });

    it('metricPercent should render "—" for null', () => {
      expect(component.metricPercent(null)).toBe('—');
    });

    it('metricRatio should render a ratio with 2 decimals', () => {
      expect(component.metricRatio(1.5)).toBe('1,50');
    });

    it('metricRatio should render "—" for null', () => {
      expect(component.metricRatio(null)).toBe('—');
    });
  });

  it('should show an error state when discovery fails', () => {
    fundServiceSpy.discovery.and.returnValue(throwError(() => ({ error: { message: 'boom' } })));
    fixture = TestBed.createComponent(FundDiscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('boom');
    expect(component.loading).toBeFalse();
  });
});
