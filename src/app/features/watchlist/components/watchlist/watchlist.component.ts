import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { Watchlist, WatchlistSecurity } from '../../models/watchlist.model';
import { WatchlistService } from '../../services/watchlist.service';
import { SecurityType } from '../../../securities/models/security.model';

type WatchlistSecurityTypeFilter = 'ALL' | SecurityType;

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit {
  watchlists: Watchlist[] = [];
  selectedWatchlistId = '';

  selectedType: WatchlistSecurityTypeFilter = 'ALL';
  newWatchlistName = '';

  readonly typeOptions: { value: WatchlistSecurityTypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Sve hartije' },
    { value: 'STOCK', label: 'Akcije' },
    { value: 'FUTURE', label: 'Fjučersi' },
    { value: 'FOREX', label: 'Forex' },
  ];

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly toastService: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.watchlistService.watchlists$.subscribe(watchlists => {
      this.watchlists = watchlists;

      if (!this.selectedWatchlistId && watchlists.length > 0) {
        this.selectedWatchlistId = watchlists[0].id;
      }

      if (
        this.selectedWatchlistId &&
        !watchlists.some(watchlist => watchlist.id === this.selectedWatchlistId)
      ) {
        this.selectedWatchlistId = watchlists[0]?.id ?? '';
      }
    });
  }

  get selectedWatchlist(): Watchlist | undefined {
    return this.watchlists.find(watchlist => watchlist.id === this.selectedWatchlistId);
  }

  get filteredSecurities(): WatchlistSecurity[] {
    const securities = this.selectedWatchlist?.securities ?? [];

    if (this.selectedType === 'ALL') {
      return securities;
    }

    return securities.filter(security => security.type === this.selectedType);
  }

  createWatchlist(): void {
    const name = this.newWatchlistName.trim();

    if (!name) {
      this.toastService.error('Unesite naziv watchliste.');
      return;
    }

    const created = this.watchlistService.createWatchlist(name);
    this.selectedWatchlistId = created.id;
    this.newWatchlistName = '';

    this.toastService.success('Watchlista je kreirana.');
  }

  removeSecurity(security: WatchlistSecurity): void {
    if (!this.selectedWatchlistId) {
      return;
    }

    this.watchlistService.removeSecurityFromWatchlist(
      this.selectedWatchlistId,
      security.id,
    );

    this.toastService.success('Hartija je uklonjena iz watchliste.');
  }

  createOrder(security: WatchlistSecurity): void {
    this.router.navigate(['/orders/create', 'BUY', security.id]);
  }

  formatPrice(value: number, currency = ''): string {
    const formatted = new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

    return currency ? `${formatted} ${currency}` : formatted;
  }

  formatVolume(value: number): string {
    return new Intl.NumberFormat('sr-RS').format(value);
  }

  formatChange(security: WatchlistSecurity): string {
    const sign = security.change >= 0 ? '+' : '';

    return `${sign}${security.changePercent.toFixed(2)}%`;
  }

  getChangeClass(security: WatchlistSecurity): string {
    if (security.change > 0) {
      return 'text-green-600';
    }

    if (security.change < 0) {
      return 'text-red-600';
    }

    return 'text-muted-foreground';
  }

  getTypeLabel(type: SecurityType): string {
    const map: Record<SecurityType, string> = {
      STOCK: 'Akcija',
      FUTURE: 'Fjučers',
      FOREX: 'Forex',
    };

    return map[type];
  }

  trackBySecurity(index: number, security: WatchlistSecurity): number {
    return security.id;
  }

  trackByWatchlist(index: number, watchlist: Watchlist): string {
    return watchlist.id;
  }
}
