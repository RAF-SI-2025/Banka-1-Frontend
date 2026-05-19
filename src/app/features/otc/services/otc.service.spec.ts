import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { OtcService } from './otc.service';
import { environment } from 'src/environments/environment';
import {
  CounterInterbankNegotiationRequest,
  CreateInterbankNegotiationRequest,
  InterbankNegotiationView,
  OtcOffer,
  OtcOfferRevision,
} from '../models/otc.model';

/**
 * PR_33 Phase B unit testovi za inter-bank wrapper API + spojeni `getActiveOffers`.
 */
describe('OtcService — inter-bank wrapper (PR_33 Phase B)', () => {
  let service: OtcService;
  let httpMock: HttpTestingController;

  const interbankUrl = `${environment.apiUrl}/api/interbank/otc/negotiations`;
  const localUrl = `${environment.apiUrl}/otc`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OtcService],
    });
    service = TestBed.inject(OtcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getInterbankNegotiations() GET-uje wrapper URL', () => {
    const fake: InterbankNegotiationView[] = [
      {
        localId: 'neg-1',
        remoteForeignBankId: { routingNumber: 222, id: 'C-2' },
        state: {
          stock: { ticker: 'AAPL' },
          settlementDate: '2026-12-31',
          pricePerUnit: { currency: 'USD', amount: 200 },
          premium: { currency: 'USD', amount: 5 },
          buyerId: { routingNumber: 111, id: 'C-1' },
          sellerId: { routingNumber: 222, id: 'C-2' },
          amount: 10,
          lastModifiedBy: { routingNumber: 222, id: 'C-2' },
          isOngoing: true,
        },
      },
    ];

    service.getInterbankNegotiations().subscribe(res => {
      expect(res).toEqual(fake);
    });
    const req = httpMock.expectOne(interbankUrl);
    expect(req.request.method).toBe('GET');
    req.flush(fake);
  });

  it('createInterbankNegotiation() POST-uje payload', () => {
    const payload: CreateInterbankNegotiationRequest = {
      stockTicker: 'AAPL',
      settlementDate: '2026-12-31',
      priceCurrency: 'USD',
      pricePerUnit: 200,
      premiumCurrency: 'USD',
      premium: 5,
      sellerForeignBankId: { routingNumber: 222, id: 'C-2' },
      amount: 10,
    };
    service.createInterbankNegotiation(payload).subscribe();
    const req = httpMock.expectOne(interbankUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('counterInterbankNegotiation() PUT-uje na /{localId}/counter', () => {
    const body: CounterInterbankNegotiationRequest = {
      amount: 5,
      priceCurrency: 'USD',
      pricePerUnit: 250,
      premiumCurrency: 'USD',
      premium: 7,
      settlementDate: '2026-11-30',
    };
    service.counterInterbankNegotiation('neg-1', body).subscribe();
    const req = httpMock.expectOne(`${interbankUrl}/neg-1/counter`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(null);
  });

  it('acceptInterbankNegotiation() POST-uje na /{localId}/accept', () => {
    service.acceptInterbankNegotiation('neg-1').subscribe();
    const req = httpMock.expectOne(`${interbankUrl}/neg-1/accept`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('deleteInterbankNegotiation() DELETE-uje /{localId}', () => {
    service.deleteInterbankNegotiation('neg-1').subscribe();
    const req = httpMock.expectOne(`${interbankUrl}/neg-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getActiveOffers() spaja intra-bank (interbank=false) i inter-bank (interbank=true) liste', done => {
    const localOffers: OtcOffer[] = [
      {
        id: 42,
        stockTicker: 'TSLA',
        buyerId: 1, sellerId: 2,
        amount: 10,
        pricePerStock: 150,
        premium: 2,
        settlementDate: '2026-12-01',
        status: 'PENDING_BUYER',
        modifiedBy: '1',
        lastModified: '2026-05-12T10:00:00Z',
      },
    ];
    const interbankNegs: InterbankNegotiationView[] = [
      {
        localId: 'neg-xyz',
        remoteForeignBankId: { routingNumber: 222, id: 'C-2' },
        state: {
          stock: { ticker: 'AAPL' },
          settlementDate: '2026-12-31',
          pricePerUnit: { currency: 'USD', amount: 200 },
          premium: { currency: 'USD', amount: 5 },
          buyerId: { routingNumber: 111, id: 'C-1' },
          sellerId: { routingNumber: 222, id: 'C-2' },
          amount: 4,
          lastModifiedBy: { routingNumber: 222, id: 'C-2' },
          isOngoing: true,
        },
      },
    ];

    service.getActiveOffers().subscribe(merged => {
      expect(merged.length).toBe(2);
      const local = merged.find(o => !o.interbank);
      const inter = merged.find(o => !!o.interbank);
      expect(local?.id).toBe(42);
      expect(local?.counterpartyBankCode).toBe(111);
      expect(inter?.localId).toBe('neg-xyz');
      expect(inter?.counterpartyBankCode).toBe(222);
      expect(inter?.counterpartyBankName).toBe('Banka 2');
      expect(inter?.stockTicker).toBe('AAPL');
      expect(inter?.remoteId).toBe('C-2');
      done();
    });
    httpMock.expectOne(`${localUrl}/offers/active`).flush(localOffers);
    httpMock.expectOne(interbankUrl).flush(interbankNegs);
  });

  it('getActiveOffers() ne pada ako inter-bank API vrati 500', done => {
    const localOffers: OtcOffer[] = [
      {
        id: 1, stockTicker: 'X', buyerId: 1, sellerId: 2, amount: 1,
        pricePerStock: 10, premium: 1, settlementDate: '2026-12-01',
        status: 'PENDING_BUYER', modifiedBy: '1', lastModified: '',
      },
    ];
    service.getActiveOffers().subscribe(merged => {
      expect(merged.length).toBe(1);
      expect(merged[0].interbank).toBe(false);
      done();
    });
    httpMock.expectOne(`${localUrl}/offers/active`).flush(localOffers);
    httpMock.expectOne(interbankUrl).flush({ msg: 'down' }, { status: 500, statusText: 'Server Error' });
  });
});

/**
 * WP-25 (Task D6) unit testovi za OTC negotiation history API.
 */
describe('OtcService — negotiation history (WP-25)', () => {
  let service: OtcService;
  let httpMock: HttpTestingController;

  const historyUrl = `${environment.apiUrl}/otc/offers/history`;

  const makeOffer = (overrides: Partial<OtcOffer>): OtcOffer => ({
    id: 7, stockTicker: 'AAPL', buyerId: 1, sellerId: 2,
    amount: 10, pricePerStock: 200, premium: 5,
    settlementDate: '2026-12-31', status: 'ACCEPTED',
    modifiedBy: 'C-1', lastModified: '2026-05-01T10:00:00Z',
    ...overrides,
  });

  const makeRevision = (overrides: Partial<OtcOfferRevision>): OtcOfferRevision => ({
    id: 1, offerId: 7, action: 'CREATE', actorUserId: 1, actorName: 'Marko Markovic',
    actorRole: 'BUYER',
    oldAmount: null, newAmount: 10,
    oldPricePerStock: null, newPricePerStock: 200,
    oldPremium: null, newPremium: 5,
    oldSettlementDate: null, newSettlementDate: '2026-12-31',
    createdAt: '2026-05-01T10:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OtcService],
    });
    service = TestBed.inject(OtcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getNegotiationHistory() bez filtera GET-uje history URL bez query parametara', () => {
    const fake = [makeOffer({ status: 'REJECTED' })];
    service.getNegotiationHistory({}).subscribe(res => expect(res).toEqual(fake));

    const req = httpMock.expectOne(historyUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(fake);
  });

  it('getNegotiationHistory() salje samo popunjena polja kao query parametre', () => {
    service.getNegotiationHistory({
      status: 'ACCEPTED',
      from: '2026-01-01',
      to: '2026-06-30',
      counterparty: 42,
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === historyUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('ACCEPTED');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-06-30');
    expect(req.request.params.get('counterparty')).toBe('42');
    req.flush([]);
  });

  it('getNegotiationHistory() izostavlja prazan status / undefined counterparty', () => {
    service.getNegotiationHistory({
      status: '',
      from: '2026-01-01',
      to: undefined,
      counterparty: null,
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === historyUrl);
    expect(req.request.params.has('status')).toBe(false);
    expect(req.request.params.has('to')).toBe(false);
    expect(req.request.params.has('counterparty')).toBe(false);
    expect(req.request.params.get('from')).toBe('2026-01-01');
    req.flush([]);
  });

  it('getOfferRevisions() GET-uje /otc/offers/{id}/history', () => {
    const trail = [makeRevision({ action: 'CREATE' }), makeRevision({
      id: 2, action: 'COUNTER', actorRole: 'SELLER', actorName: 'Petar Petrovic',
      oldAmount: 10, newAmount: 8, oldPricePerStock: 200, newPricePerStock: 220,
      createdAt: '2026-05-02T11:00:00Z',
    })];

    service.getOfferRevisions(7).subscribe(res => {
      expect(res.length).toBe(2);
      expect(res[1].action).toBe('COUNTER');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/otc/offers/7/history`);
    expect(req.request.method).toBe('GET');
    req.flush(trail);
  });
});
