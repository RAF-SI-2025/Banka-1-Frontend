import { Component, OnInit } from '@angular/core';
import { OtcOfferStatus, OtcOffer, OtcOfferHistoryEvent } from '../../models/otc.model';
import { OtcService } from '../../services/otc.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface OtcOfferHistory {
  id: number;
  timestamp: string;
  changedBy: string;
  oldPrice: number | null;
  newPrice: number;
  oldQuantity: number | null;
  newQuantity: number;
}

export interface OtcNegotiationView {
  offer: OtcOffer;
  expanded?: boolean;
  history: OtcOfferHistory[];
  createdAt: string;
  counterpartyName: string;
}

@Component({
  selector: 'app-otc-history',
  templateUrl: './otc-history.component.html',
})
export class OtcHistoryComponent implements OnInit {
  negotiations: OtcNegotiationView[] = [];
  loading = false;
  error: string | null = null;

  filters: {
    status: OtcOfferStatus | '';
    otherPartyId: number | '';
    dateFrom: string;
    dateTo: string;
  } = {
    status: '',
    otherPartyId: '',
    dateFrom: '',
    dateTo: '',
  };

  constructor(private otcService: OtcService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    const params = {
      ...(this.filters.status && { status: this.filters.status }),
      ...(this.filters.otherPartyId !== '' && { otherPartyId: this.filters.otherPartyId as number }),
      ...(this.filters.dateFrom && { dateFrom: this.filters.dateFrom }),
      ...(this.filters.dateTo && { dateTo: this.filters.dateTo }),
    };

    const myId = this.auth.getUserIdFromToken();
    this.otcService.getHistory(params).subscribe({
      next: (events: OtcOfferHistoryEvent[]) => {
        this.negotiations = this.groupByOffer(events, myId);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Greška pri učitavanju istorije pregovora.';
        this.loading = false;
      },
    });
  }

  private groupByOffer(events: OtcOfferHistoryEvent[], myId: number | null): OtcNegotiationView[] {
    const grouped = new Map<number, OtcOfferHistoryEvent[]>();
    for (const event of events) {
      const list = grouped.get(event.offerId) ?? [];
      list.push(event);
      grouped.set(event.offerId, list);
    }

    return Array.from(grouped.values()).map(evts => {
      evts.sort((a, b) => a.changedAt.localeCompare(b.changedAt));
      const latest = evts[evts.length - 1];
      const first = evts[0];

      const nameMap = new Map<number, string>();
      for (const e of evts) {
        if (e.actorName && !nameMap.has(e.actorId)) {
          nameMap.set(e.actorId, e.actorName);
        }
      }
      const counterpartyId = myId === latest.buyerId ? latest.sellerId : latest.buyerId;
      const counterpartyName = nameMap.get(counterpartyId) ?? `#${counterpartyId}`;

      const offer: OtcOffer = {
        id: latest.offerId,
        stockTicker: latest.stockTicker,
        buyerId: latest.buyerId,
        sellerId: latest.sellerId,
        amount: latest.newAmount,
        pricePerStock: latest.newPricePerStock,
        premium: latest.newPremium,
        settlementDate: latest.newSettlementDate,
        status: latest.newStatus,
        modifiedBy: String(latest.actorId),
        lastModified: latest.changedAt,
      };

      const history: OtcOfferHistory[] = evts.map(e => ({
        id: e.id,
        timestamp: e.changedAt,
        changedBy: e.actorName ?? `#${e.actorId}`,
        oldPrice: e.oldPricePerStock,
        newPrice: e.newPricePerStock,
        oldQuantity: e.oldAmount,
        newQuantity: e.newAmount,
      }));

      return { offer, expanded: false, history, createdAt: first.changedAt, counterpartyName };
    });
  }

  applyFilters(): void {
    this.loadHistory();
  }

  resetFilters(): void {
    this.filters = { status: '', otherPartyId: '', dateFrom: '', dateTo: '' };
    this.loadHistory();
  }

  toggleRow(neg: OtcNegotiationView): void {
    neg.expanded = !neg.expanded;
  }
}
