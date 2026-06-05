import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Watchlist, WatchlistItem, WatchlistListingType } from '../../models/watchlist.model';
import { WatchlistService } from '../../services/watchlist.service';

type ListingTypeFilter = 'ALL' | WatchlistListingType;

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlists: Watchlist[] = [];
  selectedWatchlistId: number | null = null;
  items: WatchlistItem[] = [];
  isLoadingItems = false;
  selectedListingType: ListingTypeFilter = 'ALL';
  newWatchlistName = '';

  readonly listingTypeOptions: { value: ListingTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURES', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
    { value: 'OPTION', label: 'Opcije' },
  ];

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.watchlistService.refreshWatchlists();

    this.watchlistService.watchlists$.subscribe((watchlists) => {
      this.watchlists = watchlists;

      if (this.selectedWatchlistId === null && watchlists.length > 0) {
        this.selectWatchlist(watchlists[0].id);
      } else if (
        this.selectedWatchlistId !== null &&
        !watchlists.some((w) => w.id === this.selectedWatchlistId)
      ) {
        this.selectWatchlist(watchlists[0]?.id ?? null);
      }
    });
  }

  get selectedWatchlist(): Watchlist | undefined {
    return this.watchlists.find((w) => w.id === this.selectedWatchlistId);
  }

  get filteredItems(): WatchlistItem[] {
    if (this.selectedListingType === 'ALL') return this.items;
    return this.items.filter((item) => item.listingType === this.selectedListingType);
  }

  selectWatchlist(id: number | null): void {
    this.selectedWatchlistId = id;
    if (id !== null) {
      this.loadItems(id);
    } else {
      this.items = [];
    }
  }

  onWatchlistChange(id: number): void {
    this.selectWatchlist(id);
  }

  private loadItems(watchlistId: number): void {
    this.isLoadingItems = true;
    this.watchlistService.getItems(watchlistId).subscribe({
      next: (items) => {
        this.items = items;
        this.isLoadingItems = false;
      },
      error: () => {
        this.items = [];
        this.isLoadingItems = false;
      },
    });
  }

  createWatchlist(): void {
    const name = this.newWatchlistName.trim();
    if (!name) return;

    this.watchlistService.createWatchlist(name).subscribe({
      next: (watchlist) => {
        this.newWatchlistName = '';
        this.selectWatchlist(watchlist.id);
      },
    });
  }

  deleteWatchlist(): void {
    if (this.selectedWatchlistId === null) return;
    this.watchlistService.deleteWatchlist(this.selectedWatchlistId).subscribe();
  }

  removeItem(item: WatchlistItem): void {
    if (this.selectedWatchlistId === null) return;

    this.watchlistService.removeItem(this.selectedWatchlistId, item.id).subscribe({
      next: () => {
        this.items = this.items.filter((i) => i.id !== item.id);
      },
    });
  }

  createOrder(item: WatchlistItem): void {
    this.router.navigate(['/orders/create/buy', item.listingId]);
  }

  formatPrice(item: WatchlistItem): string {
    return this.formatNumber(parseFloat(item.price));
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatVolume(value: number): string {
    return new Intl.NumberFormat('sr-RS').format(value);
  }

  getChangeClass(item: WatchlistItem): string {
    const change = parseFloat(item.change);
    if (change > 0) return 'change-positive';
    if (change < 0) return 'change-negative';
    return 'change-neutral';
  }

  formatChange(item: WatchlistItem): string {
    const change = parseFloat(item.change);
    const sign = change > 0 ? '+' : '';
    return `${sign}${this.formatNumber(change)}`;
  }
}
