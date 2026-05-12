import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { OtcService } from '../../services/otc.service';
import { StockPriceService } from '../../services/stock-price.service';
import { OptionContract, OptionContractStatus } from '../../models/otc.model';

interface OptionContractView {
  id: number;
  stockTicker: string;
  amount: number;
  pricePerStock: number;
  settlementDate: string;
  counterpartyId: number;
  counterpartyRole: 'BUYER' | 'SELLER';
  status: OptionContractStatus;
  createdAt: string;
  exercisedAt?: string;
  /**
   * PR_15 C15.8: live mark-to-market profit ako kupac iskoristi opciju sada.
   * Kalkulacija: (current_market_price - strike) * amount, samo za BUYER stranu;
   * za SELLER stranu se prikazuje obrnuti znak.
   * Null dok se ne ucita stock-price snapshot.
   */
  liveProfit?: number;
  /**
   * PR_33 Phase B: cross-bank metadata (kopirano iz OptionContract).
   */
  interbank?: boolean;
  counterpartyBankCode?: number;
  counterpartyBankName?: string;
}

export type OtcContractFilterMode = 'all' | 'local' | 'banka2';

/**
 * PR_11 C11.7 + PR_14 C14.5 + PR_15 C15.8 + PR_33 Phase B: Sklopljeni ugovori stranica.
 *
 * <p>PR_15 C15.8 dodaje live mark-to-market profit kolonu — povlaci current price
 * iz market-service-a (preko {@link StockPriceService}) za sve ticker-e iz
 * sklopljenih ugovora i racuna teorijski profit ako bi se opcija sada iskoristila.
 *
 * <p>PR_33 Phase B dodaje "Banka 2" badge kolonu + filter dropdown ("Svi / Naša / Banka 2")
 * koji omogucava pregled cross-bank ugovora odvojeno od intra-bank ugovora.
 *
 * <p>Polling 30s; pri unmount-u subscription se cisti da ne izazove memory leak.
 */
@Component({
  selector: 'app-otc-contracts',
  templateUrl: './otc-contracts.component.html',
})
export class OtcContractsComponent implements OnInit, OnDestroy {

  contracts: OptionContractView[] = [];
  loading = false;
  error: string | null = null;

  statusFilter = new FormControl<OptionContractStatus | 'ALL'>('ACTIVE');
  /** PR_33 Phase B: filter banaka (intra/inter-bank). */
  bankFilter: OtcContractFilterMode = 'all';

  private priceSub?: Subscription;
  private currentUserId = Number(localStorage.getItem('userId') || 0);

  constructor(
    private otcService: OtcService,
    private stockPriceService: StockPriceService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.statusFilter.valueChanges.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.priceSub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    const filter = this.statusFilter.value;
    const status = filter && filter !== 'ALL' ? filter : undefined;
    this.otcService.myContracts(status).subscribe({
      next: items => {
        this.contracts = items.map(c => this.toView(c));
        this.loading = false;
        this.subscribeLivePrices();
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju ugovora.';
        this.contracts = [];
        this.loading = false;
      }
    });
  }

  /**
   * PR_33 Phase B: vraca contracts filtrirane po `bankFilter`-u.
   * 'all' → svi; 'local' → samo intra-bank; 'banka2' → samo cross-bank.
   */
  get visibleContracts(): OptionContractView[] {
    if (this.bankFilter === 'all') return this.contracts;
    if (this.bankFilter === 'banka2') return this.contracts.filter(c => !!c.interbank);
    return this.contracts.filter(c => !c.interbank);
  }

  setBankFilter(mode: OtcContractFilterMode): void {
    this.bankFilter = mode;
  }

  exercise(c: OptionContractView): void {
    if (!confirm(`Iskoristiti opciju za ${c.amount}× ${c.stockTicker} po ${c.pricePerStock}?`)) {
      return;
    }
    this.otcService.exercise(c.id).subscribe({
      next: () => {
        alert('SAGA OTC_EXERCISE pokrenuta. Status mozete pratiti u istoriji transakcija.');
        this.load();
      },
      error: err => this.error = err?.error?.message || 'Greska pri pokretanju saga-e.',
    });
  }

  isActive(c: OptionContractView): boolean {
    return c.status === 'ACTIVE' && new Date(c.settlementDate) >= new Date();
  }

  /**
   * PR_15 C15.8: subscribe na poll stream za sve unique ticker-e u contracts-a.
   * Kada snapshot stigne, update-uje liveProfit za svaki red.
   */
  private subscribeLivePrices(): void {
    this.priceSub?.unsubscribe();
    const tickers = Array.from(new Set(this.contracts.map(c => c.stockTicker)));
    if (tickers.length === 0) {
      return;
    }
    this.priceSub = this.stockPriceService.poll(tickers).subscribe(snapshots => {
      const priceMap = new Map(snapshots.map(s => [s.ticker, s.currentPrice]));
      this.contracts = this.contracts.map(c => {
        const market = priceMap.get(c.stockTicker);
        if (market === undefined) {
          return { ...c, liveProfit: undefined };
        }
        const profitPerShare = market - c.pricePerStock;
        const sign = c.counterpartyRole === 'SELLER' ? 1 : -1;
        return { ...c, liveProfit: sign * profitPerShare * c.amount };
      });
    });
  }

  private toView(c: OptionContract): OptionContractView {
    const iAmBuyer = c.buyerId === this.currentUserId;
    return {
      id: c.id,
      stockTicker: c.stockTicker,
      amount: c.amount,
      pricePerStock: c.pricePerStock,
      settlementDate: c.settlementDate,
      counterpartyId: iAmBuyer ? c.sellerId : c.buyerId,
      counterpartyRole: iAmBuyer ? 'SELLER' : 'BUYER',
      status: c.status,
      createdAt: c.createdAt,
      exercisedAt: c.exercisedAt,
      liveProfit: undefined,
      interbank: c.interbank,
      counterpartyBankCode: c.counterpartyBankCode,
      counterpartyBankName: c.counterpartyBankName,
    };
  }
}
