import { Component, OnInit } from '@angular/core';

import { OtcService } from '../../services/otc.service';
import {
  OtcActorRole,
  OtcHistoryFilter,
  OtcOffer,
  OtcOfferRevision,
  OtcOfferStatus,
  OtcRevisionAction,
} from '../../models/otc.model';

/**
 * WP-25 (Task D6): OTC negotiation history.
 *
 * <p>Do sada je OTC portal prikazivao samo aktivne pregovore. Ova komponenta
 * dodaje pregled istorije SVIH pregovora — uklj. zavrsene
 * (ACCEPTED/REJECTED/WITHDRAWN/EXPIRED) — sa kompletnim revision trail-om svakog
 * pregovora (stare → nove vrednosti po protivponudi, akter + uloga, timestamp).
 *
 * <p>Lista se filtrira server-side preko `GET /otc/offers/history` (status /
 * datumski opseg / druga strana). Klik na red ucitava i toggle-uje revision
 * trail tog pregovora (`GET /otc/offers/{id}/history`) — lazy, jedan po jedan.
 */
@Component({
  selector: 'app-otc-negotiation-history',
  templateUrl: './otc-negotiation-history.component.html',
})
export class OtcNegotiationHistoryComponent implements OnInit {

  negotiations: OtcOffer[] = [];
  loading = false;
  error: string | null = null;

  /** Filter draft — vezan za UI; primenjuje se na `applyFilter()`. */
  filter: OtcHistoryFilter = { status: '', from: '', to: '', counterparty: null };

  /** Status opcije za dropdown ('' = svi statusi). */
  readonly statusOptions: Array<{ value: OtcOfferStatus | ''; label: string }> = [
    { value: '',               label: 'Svi statusi' },
    { value: 'PENDING_BUYER',  label: 'Čeka kupca' },
    { value: 'PENDING_SELLER', label: 'Čeka prodavca' },
    { value: 'ACCEPTED',       label: 'Prihvaćeno' },
    { value: 'REJECTED',       label: 'Odbijeno' },
    { value: 'WITHDRAWN',      label: 'Povučeno' },
    { value: 'EXPIRED',        label: 'Isteklo' },
  ];

  /** Id pregovora cija je istorija trenutno otvorena (`null` = nijedan). */
  expandedOfferId: number | null = null;
  /** Revizije ucitane za otvoreni pregovor. */
  revisions: OtcOfferRevision[] = [];
  revisionsLoading = false;
  revisionsError: string | null = null;

  constructor(private otcService: OtcService) {}

  ngOnInit(): void {
    this.load();
  }

  /** Ucitava listu pregovora primenom tekuceg filtera. */
  load(): void {
    this.loading = true;
    this.error = null;
    this.otcService.getNegotiationHistory(this.filter).subscribe({
      next: items => {
        this.negotiations = items;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju istorije pregovora.';
        this.negotiations = [];
        this.loading = false;
      },
    });
  }

  /** Primenjuje filter — zatvara otvoreni trail i ponovo ucitava listu. */
  applyFilter(): void {
    this.collapse();
    this.load();
  }

  /** Resetuje sva filter polja i ponovo ucitava listu. */
  resetFilter(): void {
    this.filter = { status: '', from: '', to: '', counterparty: null };
    this.applyFilter();
  }

  /**
   * Toggle revision trail-a za dati pregovor. Prvi klik ucitava revizije;
   * ponovni klik na isti red zatvara panel.
   */
  toggleRevisions(offer: OtcOffer): void {
    if (this.expandedOfferId === offer.id) {
      this.collapse();
      return;
    }
    this.expandedOfferId = offer.id;
    this.revisions = [];
    this.revisionsError = null;
    this.revisionsLoading = true;
    this.otcService.getOfferRevisions(offer.id).subscribe({
      next: trail => {
        this.revisions = trail;
        this.revisionsLoading = false;
      },
      error: err => {
        this.revisionsError = err?.error?.message || 'Greska pri ucitavanju istorije protivponuda.';
        this.revisionsLoading = false;
      },
    });
  }

  /** Zatvara otvoreni revision trail. */
  collapse(): void {
    this.expandedOfferId = null;
    this.revisions = [];
    this.revisionsError = null;
    this.revisionsLoading = false;
  }

  isExpanded(offer: OtcOffer): boolean {
    return this.expandedOfferId === offer.id;
  }

  /** CSS klasa za status badge. */
  statusBadgeClass(status: OtcOfferStatus): string {
    switch (status) {
      case 'ACCEPTED':       return 'z-badge-green';
      case 'REJECTED':       return 'z-badge-red';
      case 'EXPIRED':        return 'z-badge-red';
      case 'WITHDRAWN':      return 'z-badge-gray';
      case 'PENDING_BUYER':
      case 'PENDING_SELLER': return 'z-badge-yellow';
      default:               return 'z-badge-gray';
    }
  }

  statusLabel(status: OtcOfferStatus): string {
    return this.statusOptions.find(o => o.value === status)?.label ?? status;
  }

  /** Citljiv naziv revizijske akcije. */
  actionLabel(action: OtcRevisionAction): string {
    switch (action) {
      case 'CREATE':   return 'Kreirana ponuda';
      case 'COUNTER':  return 'Protivponuda';
      case 'ACCEPT':   return 'Prihvaćeno';
      case 'REJECT':   return 'Odbijeno';
      case 'WITHDRAW': return 'Povučeno';
      default:         return action;
    }
  }

  roleLabel(role: OtcActorRole): string {
    return role === 'BUYER' ? 'Kupac' : 'Prodavac';
  }

  /**
   * True ako se vrednost promenila ovom revizijom — koristi se za bojenje
   * `old → new` para. Prva revizija (`CREATE`) ima `old=null` pa je sve "novo".
   */
  changed(oldVal: number | string | null, newVal: number | string | null): boolean {
    return oldVal !== newVal;
  }

  /** Skraćuje ISO datum na `yyyy-MM-dd` (settlement polje moze imati T-deo). */
  formatDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    const tIdx = raw.indexOf('T');
    return tIdx > 0 ? raw.substring(0, tIdx) : raw;
  }
}
