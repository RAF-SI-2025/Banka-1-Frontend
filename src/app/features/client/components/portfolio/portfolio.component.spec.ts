import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PortfolioComponent } from './portfolio.component';
import { PortfolioService } from '../../services/portfolio.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PortfolioSummary } from '../../models/portfolio.model';

describe('PortfolioComponent', () => {
  let component: PortfolioComponent;
  let fixture: ComponentFixture<PortfolioComponent>;
  let portfolioServiceSpy: jasmine.SpyObj<PortfolioService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

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

  beforeEach(() => {
    portfolioServiceSpy = jasmine.createSpyObj<PortfolioService>(
      'PortfolioService',
      ['getPortfolio', 'setPublicQuantity', 'exerciseOption'],
    );
    authServiceSpy = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['isActuary', 'getLoggedUser', 'isClient', 'canAccessPortfolio', 'logout'],
    );
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'success',
      'error',
      'info',
    ]);

    portfolioServiceSpy.getPortfolio.and.returnValue(of(buildPortfolioSummary()));
    authServiceSpy.isActuary.and.returnValue(true);
    authServiceSpy.getLoggedUser.and.returnValue({
      email: 'test@test.com',
      permissions: [],
    });
    authServiceSpy.isClient.and.returnValue(true);
    authServiceSpy.canAccessPortfolio.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [PortfolioComponent],
      providers: [
        { provide: PortfolioService, useValue: portfolioServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
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
});
