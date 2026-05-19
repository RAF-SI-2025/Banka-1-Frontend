import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { PortfolioComponent } from './portfolio.component';
import { PortfolioService } from '../../services/portfolio.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FundService } from '../../../funds/services/fund.service';
import { PortfolioSummary } from '../../models/portfolio.model';
import { DividendPayout } from '../../models/dividend.model';

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  let portfolioServiceSpy: jasmine.SpyObj<PortfolioService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let fundServiceSpy: jasmine.SpyObj<FundService>;

  // PR_31 follow-up: deklarisi kao funkciju koja vraca svez deep-clone, jer testovi mutiraju
  // holding.publicQuantity na ovom objektu — bez clone-a tests dele state preko beforeEach.
  const buildPortfolioSummary = (): PortfolioSummary => JSON.parse(JSON.stringify({
    holdings: [
      {
        id: 11,
        listingId: 101,
        listingType: 'STOCK',
        ticker: 'AAPL',
        quantity: 10,
        publicQuantity: 2,
        exercisable: null,
        lastModified: '2026-04-28T10:00:00',
        currentPrice: 150,
        averagePurchasePrice: 120,
        profit: 300,
      },
      {
        id: 12,
        listingId: 202,
        listingType: 'OPTION',
        ticker: 'MSFT220C',
        quantity: 1,
        publicQuantity: 0,
        exercisable: true,
        lastModified: '2026-04-28T11:00:00',
        currentPrice: 15,
        averagePurchasePrice: 10,
        profit: 5,
      },
    ],
    totalProfit: 305,
    yearlyTaxPaid: 1200,
    monthlyTaxDue: 300,
  }));

  const buildDividends = (): DividendPayout[] => [
    {
      id: 1,
      userId: 7,
      stockTicker: 'AAPL',
      listingId: 101,
      quantity: 10,
      grossAmount: 24,
      currency: 'USD',
      taxAmountRsd: 282,
      netAmount: 21.6,
      accountId: 55,
      paymentDate: '2026-03-15T00:00:00',
      forBank: false,
    },
    {
      id: 2,
      userId: 7,
      stockTicker: 'AAPL',
      listingId: 101,
      quantity: 10,
      grossAmount: 25,
      currency: 'USD',
      taxAmountRsd: 294,
      netAmount: 22.5,
      accountId: 55,
      paymentDate: '2026-04-15T00:00:00',
      forBank: false,
    },
  ];

  beforeEach(() => {
    portfolioServiceSpy = jasmine.createSpyObj<PortfolioService>(
      'PortfolioService',
      ['getPortfolio', 'setPublicQuantity', 'exerciseOption', 'getDividends'],
    );
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['isActuary', 'getLoggedUser', 'isClient', 'canAccessPortfolio', 'logout', 'hasPermission'],
    );
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'success',
      'error',
      'info',
    ]);
    fundServiceSpy = jasmine.createSpyObj<FundService>('FundService', [
      'supervised',
      'myPositions',
    ]);

    portfolioServiceSpy.getPortfolio.and.returnValue(of(buildPortfolioSummary()));
    portfolioServiceSpy.getDividends.and.returnValue(of(buildDividends()));
    authServiceSpy.isActuary.and.returnValue(true);
    authServiceSpy.hasPermission.and.returnValue(false);
    authServiceSpy.getLoggedUser.and.returnValue({
      email: 'test@test.com',
      permissions: [],
    });
    authServiceSpy.isClient.and.returnValue(true);
    authServiceSpy.canAccessPortfolio.and.returnValue(true);
    fundServiceSpy.myPositions.and.returnValue(of([]));
    fundServiceSpy.supervised.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [PortfolioComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: PortfolioService, useValue: portfolioServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: FundService, useValue: fundServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(PortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load portfolio on init', () => {
    expect(component).toBeTruthy();
    expect(portfolioServiceSpy.getPortfolio).toHaveBeenCalled();
    expect(component.holdings.length).toBe(2);
    expect(component.draftPublicQuantities['AAPL-STOCK-0']).toBe(2);
  });

  it('should update local state after successful public quantity save', () => {
    const holding = component.holdings[0];
    const loadPortfolioSpy = spyOn(component, 'loadPortfolio');
    portfolioServiceSpy.setPublicQuantity.and.returnValue(of(void 0));
    component.draftPublicQuantities['AAPL-STOCK-0'] = 6;

    component.savePublicQuantity(holding, 0);

    expect(portfolioServiceSpy.setPublicQuantity).toHaveBeenCalledWith(11, { publicQuantity: 6 });
    expect(holding.publicQuantity).toBe(6);
    expect(component.draftPublicQuantities['AAPL-STOCK-0']).toBe(6);
    expect(component.savingPublicQuantity['AAPL-STOCK-0']).toBeFalse();
    expect(loadPortfolioSpy).not.toHaveBeenCalled();
  });

  it('should reset draft value when public quantity save fails', () => {
    const holding = component.holdings[0];
    portfolioServiceSpy.setPublicQuantity.and.returnValue(
      throwError(() => new Error('save failed')),
    );
    spyOn(console, 'error');
    component.draftPublicQuantities['AAPL-STOCK-0'] = 7;

    component.savePublicQuantity(holding, 0);

    expect(component.savingPublicQuantity['AAPL-STOCK-0']).toBeFalse();
    expect(component.draftPublicQuantities['AAPL-STOCK-0']).toBe(2);
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should not call service when holding id is missing', () => {
    const holding = { ...component.holdings[0], id: undefined };

    component.savePublicQuantity(holding, 0);

    expect(portfolioServiceSpy.setPublicQuantity).not.toHaveBeenCalled();
    expect(toastServiceSpy.info).toHaveBeenCalled();
  });

  it('should reset exercising state and log error when exercise fails', () => {
    const holding = component.holdings[1];
    portfolioServiceSpy.exerciseOption.and.returnValue(
      throwError(() => new Error('exercise failed')),
    );
    spyOn(console, 'error');

    component.exerciseOption(holding, 1);

    expect(component.exercisingOption['MSFT220C-OPTION-1']).toBeFalse();
    expect(console.error).toHaveBeenCalled();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  // WP-24: dividend-history section.
  describe('dividend history', () => {
    it('should lazy-load dividends for a position when its row is first expanded', () => {
      const holding = component.holdings[0];

      component.toggleDividends(holding);

      expect(component.expandedDividendListingId).toBe(101);
      expect(portfolioServiceSpy.getDividends).toHaveBeenCalledWith(101);
      expect(component.dividendsByListing[101].length).toBe(2);
      expect(component.dividendsLoading[101]).toBeFalse();
      expect(component.dividendsError[101]).toBeFalse();
    });

    it('should collapse the row on a second toggle without re-fetching', () => {
      const holding = component.holdings[0];

      component.toggleDividends(holding);
      component.toggleDividends(holding);

      expect(component.expandedDividendListingId).toBeNull();
      expect(portfolioServiceSpy.getDividends).toHaveBeenCalledTimes(1);
    });

    it('should not re-fetch cached dividends when the row is expanded again', () => {
      const holding = component.holdings[0];

      component.toggleDividends(holding); // open + fetch
      component.toggleDividends(holding); // close
      component.toggleDividends(holding); // re-open, served from cache

      expect(component.expandedDividendListingId).toBe(101);
      expect(portfolioServiceSpy.getDividends).toHaveBeenCalledTimes(1);
    });

    it('should flag an error when the dividend fetch fails', () => {
      portfolioServiceSpy.getDividends.and.returnValue(
        throwError(() => new Error('dividends failed')),
      );
      spyOn(console, 'error');
      const holding = component.holdings[0];

      component.toggleDividends(holding);

      expect(component.dividendsError[101]).toBeTrue();
      expect(component.dividendsLoading[101]).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('should sum the net amounts of a position\'s dividends', () => {
      const holding = component.holdings[0];

      component.toggleDividends(holding);

      expect(component.getDividendTotal(101)).toBeCloseTo(44.1, 5);
    });

    it('should return a zero total for a position without dividends', () => {
      expect(component.getDividendTotal(999)).toBe(0);
    });

    it('should report a row as expanded only for the matching listingId', () => {
      const stock = component.holdings[0];

      expect(component.isDividendRowExpanded(stock)).toBeFalse();

      component.toggleDividends(stock);

      expect(component.isDividendRowExpanded(stock)).toBeTrue();
      expect(component.isDividendRowExpanded(component.holdings[1])).toBeFalse();
    });

    it('should render the dividend table when a position row is expanded', () => {
      component.toggleDividends(component.holdings[0]);
      fixture.detectChanges();

      const detailRow: HTMLElement | null =
        fixture.nativeElement.querySelector('.dividend-detail-row');
      expect(detailRow).not.toBeNull();
      // Nested dividend table — query its own <tbody> directly so the count is
      // not polluted by the outer holdings table rows.
      const dividendTbody = detailRow!.querySelector('table > tbody');
      expect(dividendTbody).not.toBeNull();
      expect(dividendTbody!.querySelectorAll('tr').length).toBe(2);
    });
  });
});
