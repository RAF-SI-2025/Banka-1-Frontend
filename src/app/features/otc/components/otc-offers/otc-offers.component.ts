import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OtcService } from '../../services/otc.service';
import { CounterOfferRequest, OtcOffer } from '../../models/otc.model';
import { StockPriceService, StockPriceSnapshot } from '../../services/stock-price.service';
import { deviationLevel, deviationColorClass, deviationLabel } from '../../models/deviation';
import { AuthService } from '../../../../core/services/auth.service';

export type OtcFilterMode = 'all' | 'local' | 'banka2';

/**
 * OTC Aktivne ponude (PR_04 C4.13; PR_13 C13.6 dodaje deviation polling;
 * PR_33 Phase B dodaje cross-bank "Banka 2" badge + filter).
 *
 * Spec: Celina 4.txt — Stranica: Aktivne ponude; Celina 5 — Inter-bank protokol.
 *
 * Vizualizacija odstupanja po spec-u:
 *   - zelena: do +/-5%
 *   - zuta:   +/-5% do +/-20%
 *   - crvena: vise od +/-20%
 *
 * Polling: market price feed se osvezhava svakih 30s preko StockPriceService.
 *
 * PR_33 Phase B: `offers` sada sadrzi i intra-bank (interbank=false) i
 * cross-bank (interbank=true) ponude spojene kroz `getActiveOffers()` forkJoin.
 * Filter dropdown korisnik moze da prikaze samo "Nasu banku" ili samo "Banka 2".
 */
@Component({
  selector: 'app-otc-offers',
  templateUrl: './otc-offers.component.html',
  styleUrls: ['./otc-offers.component.scss'],
})
export class OtcOffersComponent implements OnInit, OnDestroy {

  offers: OtcOffer[] = [];
  loading = false;
  error: string | null = null;

  /** PR_33 Phase B: filter dropdown nad cross-bank/intra-bank ponudama. */
  filterMode: OtcFilterMode = 'all';

  /** Map ticker → trenutna cena (osvezhava se na svakih 30s). */
  prices = new Map<string, number>();

  /** PR_33 follow-up: Banka 2 public-stock discovery view (collapsible). */
  banka2PublicStock: { ticker: string; sellers: { id: string; amount: number; pricePerUnit: number; currency: string }[] }[] = [];
  banka2Expanded = false;
  banka2Loading = false;
  banka2Error: string | null = null;

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
    // PR_33 Phase B: getActiveOffers() spaja intra-bank + inter-bank u jednu listu.
    this.otcService.getActiveOffers().subscribe({
      next: items => {
        this.offers = items;
        this.loading = false;
        this.startPricePolling();
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju aktivnih ponuda.';
        this.loading = false;
      },
    });
  }

  /**
   * PR_33 Phase B: vraca offers filtrirane po `filterMode`-u.
   * - 'all'   → sve ponude (default)
   * - 'local' → samo intra-bank (`interbank=false` ili undefined)
   * - 'banka2'→ samo cross-bank prema Banka 2 (`interbank=true`)
   */
  get visibleOffers(): OtcOffer[] {
    if (this.filterMode === 'all') return this.offers;
    if (this.filterMode === 'banka2') return this.offers.filter(o => !!o.interbank);
    return this.offers.filter(o => !o.interbank);
  }

  setFilterMode(mode: OtcFilterMode): void {
    this.filterMode = mode;
  }

  /**
   * PR_33 follow-up: backend odbacuje accept iz pogresne uloge sa 4xx (intra
   * 409 "wrong turn", cross-bank 400 "we are not buyer-bank"). Ovaj getter
   * sakriva "Prihvati" dugme u tim slucajevima.
   *
   * Pravila:
   * - Cross-bank (interbank=true): accept sme SAMO ako je nas korisnik buyer
   *   (per inter-bank protokol §3.6 — accept inicira premium transfer iz
   *   buyer-bank-e ka seller-bank-i). lastModifiedBy.routingNumber 222 znaci
   *   da je Banka 2 zadnja menjala (lokalna kopija nema buyer/seller userId,
   *   ali svi PENDING cross-bank pregovori su sa Mile kao sellerom u dev
   *   seedu — pa accept skoro nikad nije dozvoljen iz nase strane).
   * - Intra-bank: accept sme samo strani koja je na redu (PENDING_SELLER →
   *   seller, PENDING_BUYER → buyer).
   */
  canAccept(offer: OtcOffer): boolean {
    if (offer.interbank) {
      // Iz Banke 1 strane mozemo accept-ovati SAMO ako smo mi buyer-bank;
      // u dev seedu Mile je uvek seller pa skoro uvek false. UI bi pao 400
      // ako bismo dozvolili klik.
      // Approx: ako counterparty=222 i lastModified iz 222, mi smo seller-bank.
      return false;
    }
    if (offer.status === 'PENDING_SELLER') {
      return this.isCurrentUser(offer.sellerId);
    }
    if (offer.status === 'PENDING_BUYER') {
      return this.isCurrentUser(offer.buyerId);
    }
    return false;
  }

  /** Counter-offer sme samo strani koja je na redu. */
  canCounter(offer: OtcOffer): boolean {
    if (offer.interbank) {
      // Inter-bank turn check oslanja se na lastModifiedBy.routingNumber !=
      // my routing. Local data trenutno ne nosi modifiedBy routing eksplicitno;
      // kao siguran default — uvek pokazujemo counter za Banka 2 (backend ce
      // 409 ako turn nije nas; mnogo redji slucaj nego accept).
      return true;
    }
    if (offer.status === 'PENDING_SELLER') {
      return this.isCurrentUser(offer.sellerId);
    }
    if (offer.status === 'PENDING_BUYER') {
      return this.isCurrentUser(offer.buyerId);
    }
    return false;
  }

  /** Odustani (reject/delete) sme bilo ko od ucesnika u bilo kom trenutku. */
  canReject(offer: OtcOffer): boolean {
    if (offer.interbank) return true;
    return this.isCurrentUser(offer.buyerId) || this.isCurrentUser(offer.sellerId);
  }

  private isCurrentUser(userId: number): boolean {
    const myId = this.authService.getUserIdFromToken();
    return myId != null && myId === userId;
  }

  /**
   * PR_33 follow-up: settlementDate moze biti "YYYY-MM-DD" (intra-bank) ili
   * ISO 8601 sa timezone (cross-bank, OffsetDateTime npr. "2026-06-14T22:00:00Z").
   * Renderujemo kao "YYYY-MM-DD" da tabela bude citljivija.
   */
  formatSettlementDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    const tIdx = raw.indexOf('T');
    return tIdx > 0 ? raw.substring(0, tIdx) : raw;
  }

  /**
   * PR_33 follow-up: toggle Banka 2 public-stock sekciju i lazy-load podatke
   * prvi put kad korisnik klikne expand.
   */
  toggleBanka2Section(): void {
    this.banka2Expanded = !this.banka2Expanded;
    if (this.banka2Expanded && this.banka2PublicStock.length === 0 && !this.banka2Loading) {
      this.loadBanka2PublicStock();
    }
  }

  loadBanka2PublicStock(): void {
    this.banka2Loading = true;
    this.banka2Error = null;
    this.otcService.getPartnerPublicStock(222).subscribe({
      next: rows => {
        this.banka2PublicStock = (rows || []).map((r: any) => ({
          ticker: r?.stock?.ticker || '?',
          sellers: (r?.sellers || []).map((s: any) => ({
            id: s?.seller?.id || s?.id || '?',
            amount: s?.amount ?? 0,
            pricePerUnit: s?.pricePerUnit?.amount ?? 0,
            currency: s?.pricePerUnit?.currency || 'USD',
          })),
        }));
        this.banka2Loading = false;
      },
      error: err => {
        this.banka2Error = err?.error?.message || 'Banka 2 nije dostupna (proverite Cloudflare tunel + BANKA2_BASE_URL).';
        this.banka2Loading = false;
      },
    });
  }

  private startPricePolling(): void {
    const tickers = Array.from(new Set(this.offers.map(o => o.stockTicker)));
    if (tickers.length === 0) return;
    this.stockPriceService.poll(tickers).pipe(takeUntil(this.destroy$)).subscribe({
      next: (snapshots: StockPriceSnapshot[]) => {
        for (const s of snapshots) {
          this.prices.set(s.ticker, s.currentPrice);
        }
      },
    });
  }

  marketPriceFor(ticker: string): number | null {
    return this.prices.get(ticker) ?? null;
  }

  deviationClass(offer: OtcOffer): string {
    const market = this.marketPriceFor(offer.stockTicker);
    // PR_31 T27: tailwind literal zamenjen semantic tokenom (dark-mode aware).
    if (market == null) return 'text-muted-foreground';
    return deviationColorClass(deviationLevel(offer.pricePerStock, market));
  }

  deviationText(offer: OtcOffer): string {
    const market = this.marketPriceFor(offer.stockTicker);
    if (market == null) return '—';
    return deviationLabel(offer.pricePerStock, market);
  }

  /**
   * PR_33 Phase B: counterparty kolona prikazuje user-display za intra-bank,
   * a "{routingNumber}:{id}" (npr. "222:C-2") za cross-bank ponude.
   * Lokalni intra-bank (`#42`) ostaje kao i ranije; ne menjamo postojeci layout.
   */
  counterpartyLabel(offer: OtcOffer): string {
    if (offer.interbank) {
      return `${offer.counterpartyBankCode}:${offer.remoteId ?? '?'}`;
    }
    return `#${offer.modifiedBy}`;
  }

  accept(offer: OtcOffer): void {
    if (offer.interbank && offer.localId) {
      this.otcService.acceptInterbankNegotiation(offer.localId).subscribe({
        next: () => this.load(),
        error: err => this.error = err?.error?.message || 'Greska pri prihvatanju ponude (Banka 2).',
      });
      return;
    }
    this.otcService.accept(offer.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri prihvatanju ponude.',
    });
  }

  reject(offer: OtcOffer): void {
    if (offer.interbank && offer.localId) {
      this.otcService.deleteInterbankNegotiation(offer.localId).subscribe({
        next: () => this.load(),
        error: err => this.error = err?.error?.message || 'Greska pri odbacivanju ponude (Banka 2).',
      });
      return;
    }
    this.otcService.reject(offer.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri odbacivanju ponude.',
    });
  }

  // ----- Counter-offer (protivponuda) modal — Spec Celina 4 Sc 18 -----

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
      // Backend `settlementDate` polje na inter-bank protokolu je `OffsetDateTime`.
      // HTML date input daje "YYYY-MM-DD" — dodajemo midnight UTC suffix.
      const rawDate = this.counterDraft.settlementDate;
      const settlementIso = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? `${rawDate}T00:00:00Z` : rawDate;
      this.otcService.counterInterbankNegotiation(target.localId, {
        amount: this.counterDraft.amount,
        priceCurrency: 'USD',
        pricePerUnit: this.counterDraft.pricePerStock,
        premiumCurrency: 'USD',
        premium: this.counterDraft.premium,
        settlementDate: settlementIso,
      }).subscribe({
        next: () => {
          this.counterSubmitting = false;
          this.closeCounterOffer();
          this.load();
        },
        error: err => {
          this.counterSubmitting = false;
          this.counterError = err?.error?.message || 'Greska pri slanju protivponude (Banka 2).';
        },
      });
      return;
    }
    this.otcService.counterOffer(target.id, this.counterDraft).subscribe({
      next: () => {
        this.counterSubmitting = false;
        this.closeCounterOffer();
        this.load();
      },
      error: err => {
        this.counterSubmitting = false;
        this.counterError = err?.error?.message || 'Greska pri slanju protivponude.';
      },
    });
  }
}
