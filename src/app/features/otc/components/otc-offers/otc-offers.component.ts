import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OtcService } from '../../services/otc.service';
import { CounterOfferRequest, OtcOffer } from '../../models/otc.model';
import { StockPriceService, StockPriceSnapshot } from '../../services/stock-price.service';
import { deviationLevel, deviationLabel } from '../../models/deviation';
import { AuthService } from '../../../../core/services/auth.service';

export type OtcFilterMode = 'all' | 'local' | 'banka2';

/** PR_33 Phase B: routing number partner banke (Banka 2) — mora se poklapati sa OtcService. */
const BANKA2_ROUTING = 222;

@Component({
  selector: 'app-otc-offers',
  templateUrl: './otc-offers.component.html',
  styleUrls: ['./otc-offers.component.scss'],
})
export class OtcOffersComponent implements OnInit, OnDestroy {

  offers: OtcOffer[] = [];
  loading = false;
  error: string | null = null;

  filterMode: OtcFilterMode = 'all';

  prices = new Map<string, number>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private otcService: OtcService,
    private stockPriceService: StockPriceService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.otcService.getActiveOffers().subscribe({
      next: items => {
        this.offers = items;
        this.loading = false;
        this.startPricePolling();
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju pregovora.';
        this.loading = false;
      },
    });
  }

  get visibleOffers(): OtcOffer[] {
    if (this.filterMode === 'all') return this.offers;
    if (this.filterMode === 'banka2') return this.offers.filter(o => !!o.interbank);
    return this.offers.filter(o => !o.interbank);
  }

  setFilterMode(mode: OtcFilterMode): void {
    this.filterMode = mode;
  }

  /** True when it's the current user's turn to respond (accept/counter/reject). */
  canRespond(offer: OtcOffer): boolean {
    if (offer.interbank) return false;
    if (offer.status === 'PENDING_SELLER') return this.isCurrentUser(offer.sellerId);
    if (offer.status === 'PENDING_BUYER') return this.isCurrentUser(offer.buyerId);
    return false;
  }

  canAccept(offer: OtcOffer): boolean {
    if (offer.interbank) {
      // Inter-bank: prihvatamo kada je na nama red — tj. Banka 2 (routing 222)
      // je poslednja modifikovala pregovor — i pregovor jos nije sklopljen.
      return offer.status !== 'ACCEPTED' && this.lastModifierRouting(offer) === BANKA2_ROUTING;
    }
    // Seller accepts buyer's offer; buyer accepts seller's counter-offer.
    return this.canRespond(offer);
  }

  /**
   * PR_33 Phase B: routing number poslednjeg modifikatora cross-bank pregovora.
   * `modifiedBy` je format "{routingNumber}:{id}" (mapiran u OtcService iz
   * `state.lastModifiedBy`). Vraca NaN ako parsiranje ne uspe.
   */
  private lastModifierRouting(offer: OtcOffer): number {
    const raw = offer.modifiedBy ?? '';
    const idx = raw.indexOf(':');
    return Number(idx >= 0 ? raw.substring(0, idx) : raw);
  }

  myRoleIn(offer: OtcOffer): 'Kupac' | 'Prodavac' | '—' {
    const myId = this.authService.getUserIdFromToken();
    if (myId === offer.buyerId) return 'Kupac';
    if (myId === offer.sellerId) return 'Prodavac';
    return '—';
  }

  canCounter(offer: OtcOffer): boolean {
    if (offer.interbank) return true;
    return this.canRespond(offer);
  }

  /** Reject is shown when it's the current user's turn to respond. */
  canReject(offer: OtcOffer): boolean {
    if (offer.interbank) return false;
    return this.canRespond(offer);
  }

  /**
   * Withdraw is shown when the current user is a participant but it is NOT their turn —
   * i.e. they sent or counter-offered and are now waiting for the other side.
   * For interbank offers, withdraw (delete) is always available.
   */
  canWithdraw(offer: OtcOffer): boolean {
    if (offer.interbank) return true;
    if (offer.status === 'PENDING_SELLER') return this.isCurrentUser(offer.buyerId);
    if (offer.status === 'PENDING_BUYER') return this.isCurrentUser(offer.sellerId);
    return false;
  }

  private isCurrentUser(userId: number): boolean {
    const myId = this.authService.getUserIdFromToken();
    return myId != null && myId === userId;
  }

  formatSettlementDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    const tIdx = raw.indexOf('T');
    return tIdx > 0 ? raw.substring(0, tIdx) : raw;
  }

  private startPricePolling(): void {
    const tickers = Array.from(new Set(this.offers.map(o => o.stockTicker)));
    if (tickers.length === 0) return;
    this.stockPriceService.poll(tickers).pipe(takeUntil(this.destroy$)).subscribe({
      next: (snapshots: StockPriceSnapshot[]) => {
        for (const s of snapshots) this.prices.set(s.ticker, s.currentPrice);
      },
    });
  }

  marketPriceFor(ticker: string): number | null {
    return this.prices.get(ticker) ?? null;
  }

  deviationClass(offer: OtcOffer): string {
    const market = this.marketPriceFor(offer.stockTicker);
    if (market == null) return 'text-muted-foreground';
    const level = deviationLevel(offer.pricePerStock, market);
    if (level === 'GREEN') return 'otc-deviation-low';
    if (level === 'YELLOW') return 'otc-deviation-mid';
    return 'otc-deviation-high';
  }

  deviationText(offer: OtcOffer): string {
    const market = this.marketPriceFor(offer.stockTicker);
    if (market == null) return '—';
    return deviationLabel(offer.pricePerStock, market);
  }

  counterpartyLabel(offer: OtcOffer): string {
    if (offer.interbank) return `${offer.counterpartyBankCode}:${offer.remoteId ?? '?'}`;
    return `#${offer.modifiedBy}`;
  }

  accept(offer: OtcOffer): void {
    if (offer.interbank && offer.localId) {
      this.otcService.acceptInterbankNegotiation(offer.localId).subscribe({
        next: () => this.load(),
        error: err => this.error = err?.error?.message || 'Greska pri prihvatanju (Banka 2).',
      });
      return;
    }
    this.otcService.accept(offer.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri prihvatanju ponude.',
    });
  }

  reject(offer: OtcOffer): void {
    this.otcService.reject(offer.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri odbijanju ponude.',
    });
  }

  withdraw(offer: OtcOffer): void {
    if (offer.interbank && offer.localId) {
      this.otcService.deleteInterbankNegotiation(offer.localId).subscribe({
        next: () => this.load(),
        error: err => this.error = err?.error?.message || 'Greska pri povlacenju (Banka 2).',
      });
      return;
    }
    this.otcService.withdrawOffer(offer.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri povlacenju ponude.',
    });
  }

  // ----- Counter-offer modal -----

  counterOfferTarget: OtcOffer | null = null;
  counterDraft: CounterOfferRequest = { amount: 0, pricePerStock: 0, premium: 0, settlementDate: '' };
  counterSubmitting = false;
  counterError: string | null = null;

  openCounterOffer(offer: OtcOffer): void {
    this.counterOfferTarget = offer;
    this.counterDraft = {
      amount: offer.amount,
      pricePerStock: offer.pricePerStock,
      premium: offer.premium,
      settlementDate: offer.settlementDate,
    };
    this.counterError = null;
  }

  closeCounterOffer(): void {
    this.counterOfferTarget = null;
    this.counterError = null;
  }

  submitCounterOffer(): void {
    if (!this.counterOfferTarget) return;
    if (this.counterDraft.amount <= 0 || this.counterDraft.pricePerStock <= 0
        || this.counterDraft.premium < 0 || !this.counterDraft.settlementDate) {
      this.counterError = 'Unesite validne vrednosti.';
      return;
    }
    this.counterSubmitting = true;
    const target = this.counterOfferTarget;
    if (target.interbank && target.localId) {
      const rawDate = this.counterDraft.settlementDate;
      const settlementIso = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? `${rawDate}T00:00:00Z` : rawDate;
      this.otcService.counterInterbankNegotiation(target.localId, {
        amount: this.counterDraft.amount,
        priceCurrency: target.priceCurrency ?? 'USD',
        pricePerUnit: this.counterDraft.pricePerStock,
        premiumCurrency: target.premiumCurrency ?? 'USD',
        premium: this.counterDraft.premium,
        settlementDate: settlementIso,
      }).subscribe({
        next: () => { this.counterSubmitting = false; this.closeCounterOffer(); this.load(); },
        error: err => { this.counterSubmitting = false; this.counterError = err?.error?.message || 'Greska (Banka 2).'; },
      });
      return;
    }
    this.otcService.counterOffer(target.id, this.counterDraft).subscribe({
      next: () => { this.counterSubmitting = false; this.closeCounterOffer(); this.load(); },
      error: err => { this.counterSubmitting = false; this.counterError = err?.error?.message || 'Greska pri protivponudi.'; },
    });
  }
}
