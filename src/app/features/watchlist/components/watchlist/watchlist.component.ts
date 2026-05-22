import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  Watchlist,
  WatchlistSecurity,
  WatchlistSecurityType,
} from '../../models/watchlist.model';
import { WatchlistService } from '../../services/watchlist.service';

type SecurityTypeFilter = 'ALL' | WatchlistSecurityType;

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlists: Watchlist[] = [];
  selectedWatchlistId = '';
  selectedSecurityType: SecurityTypeFilter = 'ALL';
  newWatchlistName = '';

  readonly securityTypeOptions: { value: SecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
  ];

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.watchlistService.watchlists$.subscribe((watchlists) => {
      this.watchlists = watchlists;

      if (!this.selectedWatchlistId && watchlists.length > 0) {
        this.selectedWatchlistId = watchlists[0].id;
      }

      if (
        this.selectedWatchlistId &&
        !watchlists.some((watchlist) => watchlist.id === this.selectedWatchlistId)
      ) {
        this.selectedWatchlistId = watchlists[0]?.id ?? '';
      }
    });
  }

  get selectedWatchlist(): Watchlist | undefined {
    return this.watchlists.find(
      (watchlist) => watchlist.id === this.selectedWatchlistId,
    );
  }

  get filteredSecurities(): WatchlistSecurity[] {
    const securities = this.selectedWatchlist?.securities ?? [];

    if (this.selectedSecurityType === 'ALL') {
      return securities;
    }

    return securities.filter(
      (security) => security.securityType === this.selectedSecurityType,
    );
  }

  createWatchlist(): void {
    this.watchlistService.createWatchlist(this.newWatchlistName);
    this.newWatchlistName = '';

    const lastWatchlist = this.watchlistService.currentWatchlists.at(-1);

    if (lastWatchlist) {
      this.selectedWatchlistId = lastWatchlist.id;
    }
  }

  removeSecurity(security: WatchlistSecurity): void {
    if (!this.selectedWatchlistId) {
      return;
    }

    this.watchlistService.removeSecurityFromWatchlist(
      this.selectedWatchlistId,
      security.id,
    );
  }

  createOrder(security: WatchlistSecurity): void {
    this.router.navigate(['/orders/create/buy', security.id]);
  }

  formatPrice(security: WatchlistSecurity): string {
    const currency = security.currency ?? 'USD';

    return `${this.formatNumber(security.price)} ${currency}`;
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

  getChangeClass(security: WatchlistSecurity): string {
    if (security.dailyChange > 0) {
      return 'change-positive';
    }

    if (security.dailyChange < 0) {
      return 'change-negative';
    }

    return 'change-neutral';
  }

  formatDailyChange(security: WatchlistSecurity): string {
    const sign = security.dailyChange > 0 ? '+' : '';

    return `${sign}${this.formatNumber(security.dailyChange)} (${sign}${this.formatNumber(security.dailyChangePercent)}%)`;
  }
}
