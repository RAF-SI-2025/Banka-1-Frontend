import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { FormModalComponent } from '../../../../shared/components/form-modal/form-modal.component';
import { StateComponent } from '../../../../shared/components/state/state.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { WatchlistService } from '../../services/watchlist.service';
import { Watchlist } from '../../models/watchlist.model';

/**
 * WP-22 (Celina 3): Watchlist picker modal.
 *
 * <p>A small reusable overlay opened by the "Dodaj na watchlist" button on the
 * securities portal (list rows + detail headers). It lists the caller's
 * watchlists; clicking one adds the given `listingId` to it via
 * {@link WatchlistService.addItem}. The backend `404` (missing listing) and
 * `409` (already on the watchlist) responses are surfaced as toasts.
 *
 * <p>Standalone — drop `<app-watchlist-picker>` into any standalone component
 * that already knows the listing id it wants to add.
 */
@Component({
  selector: 'app-watchlist-picker',
  standalone: true,
  imports: [CommonModule, FormModalComponent, StateComponent],
  template: `
    <app-form-modal
      title="Dodaj na watchlist"
      [submitting]="adding"
      [hasCustomFooter]="true"
      (close)="close.emit()"
    >
      <app-state *ngIf="loading" mode="loading" text="Ucitavanje watchlista..."></app-state>
      <app-state *ngIf="!loading && loadError" mode="error" [text]="loadError"></app-state>
      <app-state
        *ngIf="!loading && !loadError && watchlists.length === 0"
        mode="empty"
        icon="star"
        title="Nema watchlista"
        text="Kreirajte watchlistu na stranici Watchlist."
      ></app-state>

      <ul
        *ngIf="!loading && !loadError && watchlists.length > 0"
        class="space-y-1"
        data-testid="watchlist-picker-list"
      >
        <li *ngFor="let wl of watchlists">
          <button
            type="button"
            class="w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-accent/40 disabled:opacity-50"
            [disabled]="adding"
            (click)="pick(wl)"
          >
            {{ wl.name }}
          </button>
        </li>
      </ul>

      <button slot="footer" type="button" class="z-btn-outline" (click)="close.emit()">
        Zatvori
      </button>
    </app-form-modal>
  `,
})
export class WatchlistPickerComponent implements OnInit {
  /** Listing id of the security to add. */
  @Input({ required: true }) listingId!: number;

  /** Emitted when the modal should close (cancel or after a successful add). */
  @Output() close = new EventEmitter<void>();
  /** Emitted after a security is successfully added to a watchlist. */
  @Output() added = new EventEmitter<Watchlist>();

  watchlists: Watchlist[] = [];
  loading = true;
  loadError: string | null = null;
  adding = false;

  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.watchlistService.getWatchlists().subscribe({
      next: (lists) => {
        this.watchlists = lists ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Greska pri ucitavanju watchlista.';
      },
    });
  }

  pick(wl: Watchlist): void {
    if (this.adding) {
      return;
    }
    this.adding = true;
    this.watchlistService.addItem(wl.id, this.listingId).subscribe({
      next: () => {
        this.adding = false;
        this.toast.success(`Hartija dodata na "${wl.name}".`);
        this.added.emit(wl);
        this.close.emit();
      },
      error: (err: { status?: number }) => {
        this.adding = false;
        if (err?.status === 409) {
          this.toast.warning('Hartija je vec na toj watchlisti.');
        } else if (err?.status === 404) {
          this.toast.error('Hartija nije pronadjena.');
        } else {
          this.toast.error('Greska pri dodavanju na watchlist.');
        }
      },
    });
  }
}
