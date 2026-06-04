import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OtcOffersComponent } from './otc-offers.component';
import { OtcService } from '../../services/otc.service';
import { StockPriceService } from '../../services/stock-price.service';
import { OtcOffer } from '../../models/otc.model';

/**
 * PR_33 Phase B unit testovi za filterMode (Naša/Banka 2/Svi).
 *
 * Komponenta zavisi od OtcService i StockPriceService — stub-ujemo ih kroz
 * lokalne objekte. UI markup nije renderovan; testiramo samo TS logiku
 * (`visibleOffers` getter + `setFilterMode`).
 */
describe('OtcOffersComponent — filter mode (PR_33 Phase B)', () => {
  let component: OtcOffersComponent;
  let otcServiceStub: jasmine.SpyObj<OtcService>;
  let priceServiceStub: jasmine.SpyObj<StockPriceService>;

  const makeOffer = (overrides: Partial<OtcOffer>): OtcOffer => ({
    id: 1, stockTicker: 'AAPL', buyerId: 1, sellerId: 2,
    amount: 10, pricePerStock: 200, premium: 5,
    settlementDate: '2026-12-31', status: 'PENDING_BUYER',
    modifiedBy: 'C-1', lastModified: '',
    ...overrides,
  });

  beforeEach(() => {
    otcServiceStub = jasmine.createSpyObj<OtcService>('OtcService', [
      'getActiveOffers', 'accept', 'reject', 'counterOffer',
      'acceptInterbankNegotiation', 'deleteInterbankNegotiation',
      'counterInterbankNegotiation',
    ]);
    priceServiceStub = jasmine.createSpyObj<StockPriceService>('StockPriceService', ['poll']);

    otcServiceStub.getActiveOffers.and.returnValue(of([]));
    priceServiceStub.poll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        OtcOffersComponent,
        { provide: OtcService, useValue: otcServiceStub },
        { provide: StockPriceService, useValue: priceServiceStub },
      ],
    });
    component = TestBed.inject(OtcOffersComponent);
  });

  it('default filterMode je "all"', () => {
    expect(component.filterMode).toBe('all');
  });

  it('visibleOffers vraca sve kad je filterMode="all"', () => {
    component.offers = [
      makeOffer({ id: 1, interbank: false }),
      makeOffer({ id: 2, interbank: true, localId: 'neg-1' }),
    ];
    component.filterMode = 'all';
    expect(component.visibleOffers.length).toBe(2);
  });

  it('visibleOffers vraca samo intra-bank kad je filterMode="local"', () => {
    component.offers = [
      makeOffer({ id: 1, interbank: false }),
      makeOffer({ id: 2, interbank: true, localId: 'neg-1' }),
      makeOffer({ id: 3, interbank: undefined }),
    ];
    component.filterMode = 'local';
    const visible = component.visibleOffers;
    expect(visible.length).toBe(2);
    expect(visible.every(o => !o.interbank)).toBe(true);
  });

  it('visibleOffers vraca samo Banka 2 kad je filterMode="banka2"', () => {
    component.offers = [
      makeOffer({ id: 1, interbank: false }),
      makeOffer({ id: 2, interbank: true, localId: 'neg-1' }),
      makeOffer({ id: 3, interbank: true, localId: 'neg-2' }),
    ];
    component.filterMode = 'banka2';
    const visible = component.visibleOffers;
    expect(visible.length).toBe(2);
    expect(visible.every(o => !!o.interbank)).toBe(true);
  });

  it('setFilterMode azurira filterMode', () => {
    component.setFilterMode('banka2');
    expect(component.filterMode).toBe('banka2');
    component.setFilterMode('local');
    expect(component.filterMode).toBe('local');
  });

  it('counterpartyLabel format: "{routingNumber}:{remoteId}" za interbank', () => {
    const offer = makeOffer({
      interbank: true,
      counterpartyBankCode: 222,
      remoteId: 'C-2',
      modifiedBy: '222:C-2',
    });
    expect(component.counterpartyLabel(offer)).toBe('222:C-2');
  });

  it('counterpartyLabel format: "#{modifiedBy}" za intra-bank', () => {
    const offer = makeOffer({ interbank: false, modifiedBy: '42' });
    expect(component.counterpartyLabel(offer)).toBe('#42');
  });

  it('accept(offer) za inter-bank zove acceptInterbankNegotiation', () => {
    otcServiceStub.acceptInterbankNegotiation.and.returnValue(of(undefined));
    const offer = makeOffer({ interbank: true, localId: 'neg-1' });
    component.accept(offer);
    expect(otcServiceStub.acceptInterbankNegotiation).toHaveBeenCalledWith('neg-1');
    expect(otcServiceStub.accept).not.toHaveBeenCalled();
  });

  it('accept(offer) za intra-bank zove accept(id)', () => {
    otcServiceStub.accept.and.returnValue(of({} as OtcOffer));
    const offer = makeOffer({ id: 42, interbank: false });
    component.accept(offer);
    expect(otcServiceStub.accept).toHaveBeenCalledWith(42);
    expect(otcServiceStub.acceptInterbankNegotiation).not.toHaveBeenCalled();
  });

  it('reject(offer) za inter-bank zove deleteInterbankNegotiation', () => {
    otcServiceStub.deleteInterbankNegotiation.and.returnValue(of(undefined));
    const offer = makeOffer({ interbank: true, localId: 'neg-1' });
    component.reject(offer);
    expect(otcServiceStub.deleteInterbankNegotiation).toHaveBeenCalledWith('neg-1');
  });

  it('reject(offer) za intra-bank zove reject(id)', () => {
    otcServiceStub.reject.and.returnValue(of({} as OtcOffer));
    const offer = makeOffer({ id: 42, interbank: false });
    component.reject(offer);
    expect(otcServiceStub.reject).toHaveBeenCalledWith(42);
  });
});
