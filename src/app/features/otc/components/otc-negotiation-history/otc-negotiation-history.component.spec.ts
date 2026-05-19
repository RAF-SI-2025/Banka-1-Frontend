import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { OtcNegotiationHistoryComponent } from './otc-negotiation-history.component';
import { OtcService } from '../../services/otc.service';
import { StateComponent } from '../../../../shared/components/state/state.component';
import { OtcOffer, OtcOfferRevision } from '../../models/otc.model';

/**
 * WP-25 (Task D6) component spec za OTC negotiation history.
 */
describe('OtcNegotiationHistoryComponent (WP-25)', () => {
  let component: OtcNegotiationHistoryComponent;
  let fixture: ComponentFixture<OtcNegotiationHistoryComponent>;
  let otcServiceSpy: jasmine.SpyObj<OtcService>;

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

  beforeEach(async () => {
    otcServiceSpy = jasmine.createSpyObj<OtcService>('OtcService', [
      'getNegotiationHistory', 'getOfferRevisions',
    ]);
    otcServiceSpy.getNegotiationHistory.and.returnValue(of([]));
    otcServiceSpy.getOfferRevisions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [OtcNegotiationHistoryComponent],
      imports: [FormsModule, StateComponent],
      providers: [{ provide: OtcService, useValue: otcServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(OtcNegotiationHistoryComponent);
    component = fixture.componentInstance;
  });

  it('kreira komponentu', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit ucitava istoriju pregovora', () => {
    otcServiceSpy.getNegotiationHistory.and.returnValue(of([makeOffer({})]));
    fixture.detectChanges();
    expect(otcServiceSpy.getNegotiationHistory).toHaveBeenCalledTimes(1);
    expect(component.negotiations.length).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('postavlja error poruku kad getNegotiationHistory padne', () => {
    otcServiceSpy.getNegotiationHistory.and.returnValue(
      throwError(() => ({ error: { message: 'pad' } })));
    fixture.detectChanges();
    expect(component.error).toBe('pad');
    expect(component.negotiations.length).toBe(0);
    expect(component.loading).toBe(false);
  });

  it('applyFilter ponovo poziva getNegotiationHistory sa tekucim filterom', () => {
    fixture.detectChanges();
    component.filter = { status: 'REJECTED', from: '2026-01-01', to: '', counterparty: 9 };
    component.applyFilter();
    expect(otcServiceSpy.getNegotiationHistory).toHaveBeenCalledTimes(2);
    expect(otcServiceSpy.getNegotiationHistory.calls.mostRecent().args[0])
      .toEqual({ status: 'REJECTED', from: '2026-01-01', to: '', counterparty: 9 });
  });

  it('resetFilter cisti sva polja i reloaduje', () => {
    fixture.detectChanges();
    component.filter = { status: 'ACCEPTED', from: '2026-01-01', to: '2026-02-01', counterparty: 3 };
    component.resetFilter();
    expect(component.filter).toEqual({ status: '', from: '', to: '', counterparty: null });
    expect(otcServiceSpy.getNegotiationHistory).toHaveBeenCalledTimes(2);
  });

  it('toggleRevisions ucitava revision trail i otvara red', () => {
    const trail = [makeRevision({}), makeRevision({ id: 2, action: 'COUNTER' })];
    otcServiceSpy.getOfferRevisions.and.returnValue(of(trail));
    fixture.detectChanges();

    component.toggleRevisions(makeOffer({ id: 7 }));
    expect(otcServiceSpy.getOfferRevisions).toHaveBeenCalledWith(7);
    expect(component.expandedOfferId).toBe(7);
    expect(component.revisions.length).toBe(2);
    expect(component.revisionsLoading).toBe(false);
  });

  it('toggleRevisions na istom redu drugi put zatvara panel', () => {
    otcServiceSpy.getOfferRevisions.and.returnValue(of([makeRevision({})]));
    fixture.detectChanges();
    const offer = makeOffer({ id: 7 });

    component.toggleRevisions(offer);
    expect(component.isExpanded(offer)).toBe(true);

    component.toggleRevisions(offer);
    expect(component.isExpanded(offer)).toBe(false);
    expect(component.revisions.length).toBe(0);
  });

  it('toggleRevisions postavlja revisionsError kad poziv padne', () => {
    otcServiceSpy.getOfferRevisions.and.returnValue(
      throwError(() => ({ error: { message: 'trail pad' } })));
    fixture.detectChanges();

    component.toggleRevisions(makeOffer({ id: 7 }));
    expect(component.revisionsError).toBe('trail pad');
    expect(component.revisionsLoading).toBe(false);
  });

  it('applyFilter zatvara prethodno otvoreni revision trail', () => {
    otcServiceSpy.getOfferRevisions.and.returnValue(of([makeRevision({})]));
    fixture.detectChanges();
    component.toggleRevisions(makeOffer({ id: 7 }));
    expect(component.expandedOfferId).toBe(7);

    component.applyFilter();
    expect(component.expandedOfferId).toBeNull();
  });

  it('changed() detektuje promenu vrednosti', () => {
    expect(component.changed(10, 8)).toBe(true);
    expect(component.changed(10, 10)).toBe(false);
    expect(component.changed(null, 10)).toBe(true);
    expect(component.changed(null, null)).toBe(false);
  });

  it('statusBadgeClass mapira statuse na badge boje', () => {
    expect(component.statusBadgeClass('ACCEPTED')).toBe('z-badge-green');
    expect(component.statusBadgeClass('REJECTED')).toBe('z-badge-red');
    expect(component.statusBadgeClass('WITHDRAWN')).toBe('z-badge-gray');
    expect(component.statusBadgeClass('PENDING_BUYER')).toBe('z-badge-yellow');
  });

  it('actionLabel i roleLabel daju citljive nazive', () => {
    expect(component.actionLabel('COUNTER')).toBe('Protivponuda');
    expect(component.actionLabel('CREATE')).toBe('Kreirana ponuda');
    expect(component.roleLabel('BUYER')).toBe('Kupac');
    expect(component.roleLabel('SELLER')).toBe('Prodavac');
  });

  it('formatDate skracuje ISO datum sa T-delom i hendluje null', () => {
    expect(component.formatDate('2026-12-31T00:00:00Z')).toBe('2026-12-31');
    expect(component.formatDate('2026-12-31')).toBe('2026-12-31');
    expect(component.formatDate(null)).toBe('—');
  });

  it('renderuje red tabele za svaki pregovor', () => {
    otcServiceSpy.getNegotiationHistory.and.returnValue(of([
      makeOffer({ id: 7 }), makeOffer({ id: 8, status: 'REJECTED' }),
    ]));
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid^="history-row-"]');
    expect(rows.length).toBe(2);
  });
});
