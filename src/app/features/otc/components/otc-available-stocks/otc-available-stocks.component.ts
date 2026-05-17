import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OtcService } from '../../services/otc.service';
import { StockPriceService, StockPriceSnapshot } from '../../services/stock-price.service';
import { OtcPublicStockEntry, CreateOtcOfferRequest } from '../../models/otc.model';

@Component({
  selector: 'app-otc-available-stocks',
  templateUrl: './otc-available-stocks.component.html',
})
export class OtcAvailableStocksComponent implements OnInit, OnDestroy {

  entries: OtcPublicStockEntry[] = [];
  loading = false;
  error: string | null = null;

  prices = new Map<string, number>();

  /** Banka 2 public-stock discovery section (collapsible). */
  banka2PublicStock: { ticker: string; sellers: { id: string; amount: number; pricePerUnit: number; currency: string }[] }[] = [];
  banka2Expanded = false;
  banka2Loading = false;
  banka2Error: string | null = null;

  /** Send Offer modal state. */
  offerTarget: OtcPublicStockEntry | null = null;
  offerDraft: { quantity: number; pricePerStock: number; premium: number; settlementDate: string } = {
    quantity: 0, pricePerStock: 0, premium: 0, settlementDate: '',
  };
  offerSubmitting = false;
  offerError: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private otcService: OtcService,
    private stockPriceService: StockPriceService,
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
    this.error = null;
    this.otcService.getPublicStocks().subscribe({
      next: groups => {
        this.entries = groups.flatMap(g =>
          g.sellers.map(s => ({ ticker: g.ticker, sellerId: s.sellerId, sellerName: s.sellerName, availableQuantity: s.availableQuantity }))
        );
        this.loading = false;
        this.startPricePolling();
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju dostupnih akcija.';
        this.loading = false;
      },
    });
  }

  private startPricePolling(): void {
    const tickers = Array.from(new Set(this.entries.map(e => e.ticker)));
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
        this.banka2Error = err?.error?.message || 'Banka 2 nije dostupna.';
        this.banka2Loading = false;
      },
    });
  }

  openSendOffer(entry: OtcPublicStockEntry): void {
    this.offerTarget = entry;
    const market = this.marketPriceFor(entry.ticker);
    this.offerDraft = {
      quantity: 0,
      pricePerStock: market ?? 0,
      premium: 0,
      settlementDate: '',
    };
    this.offerError = null;
  }

  closeSendOffer(): void {
    this.offerTarget = null;
    this.offerError = null;
  }

  submitSendOffer(): void {
    if (!this.offerTarget) return;
    const d = this.offerDraft;
    if (d.quantity <= 0 || d.pricePerStock <= 0 || d.premium < 0 || !d.settlementDate) {
      this.offerError = 'Unesite validne vrednosti.';
      return;
    }
    this.offerSubmitting = true;
    const req: CreateOtcOfferRequest = {
      stockTicker: this.offerTarget.ticker,
      sellerId: this.offerTarget.sellerId,
      amount: d.quantity,
      pricePerStock: d.pricePerStock,
      premium: d.premium,
      settlementDate: d.settlementDate,
    };
    this.otcService.createOffer(req).subscribe({
      next: () => {
        this.offerSubmitting = false;
        this.closeSendOffer();
        this.load();
      },
      error: err => {
        this.offerSubmitting = false;
        this.offerError = err?.error?.message || 'Greska pri slanju ponude.';
      },
    });
  }
}
