import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';
import { WatchlistDto, WatchlistItemDto, WatchlistService, SecurityListingType } from '../../services/watchlist.service';
import { Watchlist, WatchlistSecurityType } from '../../models/watchlist.model';

type SecurityTypeFilter = 'ALL' | SecurityListingType;

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlists: WatchlistDto[] = [];
  selectedWatchlistId: number | null = null;
  selectedSecurityType: SecurityTypeFilter = 'ALL';
  newWatchlistName = '';

  isLoading = false;
  isCreating = false;
  showCreateForm = false;

  readonly securityTypeOptions: { value: SecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
    { value: 'OPTION', label: 'Opcije' },
  ];

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadWatchlists();
  }

  loadWatchlists(): void {
    this.isLoading = true;
    this.watchlistService.getWatchlists().subscribe({
      next: (watchlists) => {
        this.watchlists = watchlists;
        if (watchlists.length > 0 && !this.selectedWatchlistId) {
          this.selectedWatchlistId = watchlists[0].id;
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Greška pri učitavanju watchlist-a.');
        this.isLoading = false;
      },
    });
  }

  loadSelectedWatchlist(): void {
    if (!this.selectedWatchlistId) return;

    const listingType = this.selectedSecurityType === 'ALL' ? undefined : this.selectedSecurityType;
    this.watchlistService.getWatchlist(this.selectedWatchlistId, listingType).subscribe({
      next: () => {
        // Watchlist updated
      },
      error: () => {
        this.toastService.error('Greška pri učitavanju stavki watchlist-a.');
      },
    });
  }

  get selectedWatchlist(): WatchlistDto | undefined {
    return this.watchlists.find((w) => w.id === this.selectedWatchlistId);
  }

  get filteredSecurities(): WatchlistItemDto[] {
    const items = this.selectedWatchlist?.items ?? [];

    if (this.selectedSecurityType === 'ALL') {
      return items;
    }

    return items.filter((item) => item.listingType === this.selectedSecurityType);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newWatchlistName = '';
    }
  }

  createWatchlist(): void {
    if (!this.newWatchlistName.trim()) {
      this.toastService.error('Unesite naziv watchlist-a.');
      return;
    }

    this.isCreating = true;
    this.watchlistService.createWatchlist(this.newWatchlistName).subscribe({
      next: (newWatchlist) => {
        this.watchlists.push(newWatchlist);
        this.selectedWatchlistId = newWatchlist.id;
        this.newWatchlistName = '';
        this.showCreateForm = false;
        this.toastService.success('Watchlist je kreiran.');
        this.isCreating = false;
      },
      error: () => {
        this.toastService.error('Greška pri kreiranju watchlist-a.');
        this.isCreating = false;
      },
    });
  }

  deleteWatchlist(watchlistId: number): void {
    if (!confirm('Da li ste sigurni da želite obbrišete ovaj watchlist?')) {
      return;
    }

    this.watchlistService.deleteWatchlist(watchlistId).subscribe({
      next: () => {
        this.watchlists = this.watchlists.filter((w) => w.id !== watchlistId);
        if (this.selectedWatchlistId === watchlistId) {
          this.selectedWatchlistId = this.watchlists.length > 0 ? this.watchlists[0].id : null;
        }
        this.toastService.success('Watchlist je obrisan.');
      },
      error: () => {
        this.toastService.error('Greška pri brisanju watchlist-a.');
      },
    });
  }

  removeItemFromWatchlist(watchlistId: number, itemId: number): void {
    if (!confirm('Da li ste sigurni da želite obbrišete ovu stavku?')) {
      return;
    }

    this.watchlistService.removeItemFromWatchlist(watchlistId, itemId).subscribe({
      next: () => {
        const watchlist = this.watchlists.find((w) => w.id === watchlistId);
        if (watchlist?.items) {
          watchlist.items = watchlist.items.filter((item) => item.id !== itemId);
        }
        this.toastService.success('Stavka je obrisana.');
      },
      error: () => {
        this.toastService.error('Greška pri brisanju stavke.');
      },
    });
  }

  createOrder(security: WatchlistItemDto): void {
    this.router.navigate(['/orders/create/buy', security.listingId]);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'change-positive';
    if (change < 0) return 'change-negative';
    return 'change-neutral';
  }

  trackById(index: number, watchlist: WatchlistDto): number {
    return watchlist.id;
  }

  trackByItemId(index: number, item: WatchlistItemDto): number {
    return item.id;
  }

  formatPrice(security: WatchlistItemDto): string {
    return `${this.formatMoney(security.price)} RSD`;
  }

  formatVolume(value: number): string {
    return new Intl.NumberFormat('sr-RS').format(value);
  }

  formatDailyChange(security: WatchlistItemDto): string {
    const sign = security.change > 0 ? '+' : '';
    return `${sign}${this.formatMoney(security.change)} (${sign}${security.changePercent?.toFixed(2)}%)`;
  }

  removeSecurity(security: WatchlistItemDto): void {
    if (this.selectedWatchlistId) {
      this.removeItemFromWatchlist(this.selectedWatchlistId, security.id);
    }
  }
}

