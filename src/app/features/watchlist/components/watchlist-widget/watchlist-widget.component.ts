import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { WatchlistService } from '../../services/watchlist.service';
import { Watchlist, WatchlistItem } from '../../models/watchlist.model';

/**
 * WP-22 (Celina 3): Topbar watchlist quick-access widget panel.
 *
 * <p>The dropdown body for the topbar's "star" button. When `open` flips true
 * it fetches the caller's first watchlist and that watchlist's enriched items
 * (ticker, current price, daily change, volume). Each row links to the
 * security-detail page.
 *
 * <p>Standalone — the topbar renders `<app-watchlist-widget>` inside its own
 * `relative` dropdown shell, reusing the existing theme/avatar/notification
 * open/close pattern.
 */
@Component({
  selector: 'app-watchlist-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './watchlist-widget.component.html',
})
export class WatchlistWidgetComponent implements OnChanges {
  /** Driven by the topbar; the panel lazily fetches when it becomes true. */
  @Input() open = false;

  /** Emitted when a row link is clicked so the topbar can close the dropdown. */
  @Output() navigate = new EventEmitter<void>();

  items: WatchlistItem[] = [];
  watchlist: Watchlist | null = null;
  loading = false;
  error = false;
  /** True once a fetch has run, so we do not refetch on every open. */
  private loadedOnce = false;

  constructor(private readonly watchlistService: WatchlistService) {}

  ngOnChanges(): void {
    if (this.open && !this.loadedOnce) {
      this.load();
    }
  }

  /** Fetches the first watchlist and its enriched items. */
  load(): void {
    this.loading = true;
    this.error = false;
    this.loadedOnce = true;
    this.watchlistService.getWatchlists().subscribe({
      next: (lists) => {
        this.watchlist = lists?.[0] ?? null;
        if (!this.watchlist) {
          this.items = [];
          this.loading = false;
          return;
        }
        this.watchlistService.getItems(this.watchlist.id).subscribe({
          next: (items) => {
            this.items = items ?? [];
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = true;
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
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

  trackByItem(_: number, it: WatchlistItem): number {
    return it.id;
  }
}
