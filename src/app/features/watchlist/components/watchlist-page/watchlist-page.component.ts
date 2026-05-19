import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { StateComponent } from '../../../../shared/components/state/state.component';
import { FormModalComponent } from '../../../../shared/components/form-modal/form-modal.component';
import { LucideIconComponent } from '../../../../shared/icons/lucide-icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { WatchlistService } from '../../services/watchlist.service';
import { Watchlist, WatchlistItem } from '../../models/watchlist.model';

/**
 * WP-22 (Celina 3): Watchlist management page (`/watchlists`).
 *
 * <p>Lets a trader (clients with trading + actuary agents) manage their
 * personalized watchlists: list every watchlist, create / delete named ones,
 * view a selected watchlist's followed securities enriched with live market
 * data (price / daily change / volume), remove an item, and filter the items
 * by security type.
 *
 * <p>Standalone, lazy-loaded via `loadComponent` so it stays out of the
 * initial bundle.
 */

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-watchlist-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StateComponent,
    FormModalComponent,
    LucideIconComponent,
  ],
  templateUrl: './watchlist-page.component.html',
})
export class WatchlistPageComponent implements OnInit {
  watchlists: Watchlist[] = [];
  selectedWatchlist: Watchlist | null = null;

  items: WatchlistItem[] = [];

  /** Loading flag for the watchlist sidebar. */
  isLoading = true;
  /** Loading flag for the selected watchlist's items. */
  itemsLoading = false;
  error: string | null = null;
  itemsError: string | null = null;

  /* Create-watchlist modal. */
  createModalOpen = false;
  newName = '';
  creating = false;
  createError: string | null = null;

  /** Item security-type filter; `''` means "all types". */
  typeFilter = '';

  readonly typeOptions: SelectOption[] = [
    { value: '', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjucersi' },
    { value: 'FOREX', label: 'Forex' },
  ];

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadWatchlists();
  }

  loadWatchlists(): void {
    this.isLoading = true;
    this.error = null;
    this.watchlistService.getWatchlists().subscribe({
      next: (lists) => {
        this.watchlists = lists ?? [];
        this.isLoading = false;
        /* Auto-select the first watchlist (or keep the current one if it
           still exists after a reload). */
        const stillThere = this.selectedWatchlist
          ? this.watchlists.find((w) => w.id === this.selectedWatchlist!.id)
          : undefined;
        const next = stillThere ?? this.watchlists[0] ?? null;
        if (next) {
          this.selectWatchlist(next);
        } else {
          this.selectedWatchlist = null;
          this.items = [];
        }
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Greska pri ucitavanju watchlista.';
      },
    });
  }

  selectWatchlist(wl: Watchlist): void {
    this.selectedWatchlist = wl;
    this.loadItems();
  }

  loadItems(): void {
    if (!this.selectedWatchlist) {
      this.items = [];
      return;
    }
    this.itemsLoading = true;
    this.itemsError = null;
    this.watchlistService
      .getItems(this.selectedWatchlist.id, this.typeFilter || undefined)
      .subscribe({
        next: (items) => {
          this.items = items ?? [];
          this.itemsLoading = false;
        },
        error: () => {
          this.itemsLoading = false;
          this.itemsError = 'Greska pri ucitavanju hartija.';
        },
      });
  }

  onTypeFilterChange(): void {
    this.loadItems();
  }

  /* ---- create watchlist ---- */

  openCreateModal(): void {
    this.newName = '';
    this.createError = null;
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.creating) {
      return;
    }
    this.createModalOpen = false;
  }

  createWatchlist(): void {
    const name = this.newName.trim();
    if (!name) {
      this.createError = 'Naziv je obavezan.';
      return;
    }
    this.creating = true;
    this.createError = null;
    this.watchlistService.createWatchlist(name).subscribe({
      next: (created) => {
        this.creating = false;
        this.createModalOpen = false;
        this.toast.success('Watchlist kreiran.');
        this.selectedWatchlist = created;
        this.loadWatchlists();
      },
      error: () => {
        this.creating = false;
        this.createError = 'Greska pri kreiranju watchlista.';
      },
    });
  }

  /* ---- delete watchlist ---- */

  deleteWatchlist(wl: Watchlist): void {
    if (!confirm(`Obrisati watchlist "${wl.name}"?`)) {
      return;
    }
    this.watchlistService.deleteWatchlist(wl.id).subscribe({
      next: () => {
        this.toast.success('Watchlist obrisan.');
        if (this.selectedWatchlist?.id === wl.id) {
          this.selectedWatchlist = null;
        }
        this.loadWatchlists();
      },
      error: () => this.toast.error('Greska pri brisanju watchlista.'),
    });
  }

  /* ---- remove item ---- */

  removeItem(it: WatchlistItem): void {
    if (!this.selectedWatchlist) {
      return;
    }
    this.watchlistService
      .removeItem(this.selectedWatchlist.id, it.id)
      .subscribe({
        next: () => {
          this.toast.success('Hartija uklonjena sa watchlista.');
          this.loadItems();
        },
        error: () => this.toast.error('Greska pri uklanjanju hartije.'),
      });
  }

  /** Routerlink target for a watchlist item's security-detail page. */
  detailLink(it: WatchlistItem): string[] {
    const segment =
      it.listingType === 'FUTURE'
        ? 'future'
        : it.listingType === 'FOREX'
          ? 'forex'
          : 'stock';
    return ['/securities', segment, String(it.listingId)];
  }

  changeClass(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  trackByWatchlist(_: number, wl: Watchlist): number {
    return wl.id;
  }

  trackByItem(_: number, it: WatchlistItem): number {
    return it.id;
  }
}
