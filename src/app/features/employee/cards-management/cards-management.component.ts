import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CardAdminPage,
  CardAdminSummary,
  CardService,
} from '../../client/services/card.service';
import { StateComponent } from '../../../shared/components/state/state.component';
import { AppPaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * PR_32 — Cards Management portal za zaposlene (Celina 2 spec).
 *
 * <p>Tabela svih kartica u banci sa pretragom (po broju kartice / broju računa /
 * brendu) + status filter (ACTIVE / BLOCKED / DEACTIVATED) + akcije blokiraj /
 * odblokiraj / deaktiviraj. Pagination je server-side preko Spring Data Page
 * envelope-a koji vraca `GET /api/cards/all`.
 *
 * <p>Standalone — gateway-side autorizacija je BASIC role; ruta je dodatno
 * gard-ovana `roleGuard`-om sa `CLIENT_MANAGE` permisijom u
 * `app-routing.module.ts`.
 */
type StatusFilter = '' | 'ACTIVE' | 'BLOCKED' | 'DEACTIVATED';

@Component({
  selector: 'app-cards-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StateComponent,
    AppPaginationComponent,
    LucideIconComponent,
  ],
  templateUrl: './cards-management.component.html',
  styleUrls: ['./cards-management.component.scss'],
})
export class CardsManagementComponent implements OnInit {
  cards: CardAdminSummary[] = [];
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  isLoading = true;
  error: string | null = null;

  statusFilter: StatusFilter = '';
  searchQuery = '';

  constructor(
    private readonly cardService: CardService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.cardService
      .getAllCards(
        this.currentPage,
        this.pageSize,
        this.statusFilter || undefined,
        this.searchQuery.trim() || undefined,
      )
      .subscribe({
        next: (page: CardAdminPage) => {
          this.cards = page?.content ?? [];
          this.totalElements = page?.totalElements ?? 0;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'Greska pri ucitavanju kartica.';
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.load();
  }

  onStatusFilter(status: StatusFilter): void {
    this.statusFilter = status;
    this.currentPage = 0;
    this.load();
  }

  block(card: CardAdminSummary): void {
    if (card.status !== 'ACTIVE') {
      return;
    }
    this.cardService.blockCard(card.id).subscribe({
      next: () => {
        this.toast.success('Kartica blokirana.');
        this.load();
      },
      error: () => this.toast.error('Greska pri blokiranju kartice.'),
    });
  }

  unblock(card: CardAdminSummary): void {
    if (card.status !== 'BLOCKED') {
      return;
    }
    this.cardService.unblockCard(card.id).subscribe({
      next: () => {
        this.toast.success('Kartica odblokirana.');
        this.load();
      },
      error: () => this.toast.error('Greska pri odblokiranju kartice.'),
    });
  }

  deactivate(card: CardAdminSummary): void {
    if (card.status === 'DEACTIVATED') {
      return;
    }
    const masked = card.cardNumber;
    if (!confirm(`Trajno deaktivirati karticu ${masked}? Ova akcija je nepovratna.`)) {
      return;
    }
    this.cardService.deactivateCard(card.id).subscribe({
      next: () => {
        this.toast.success('Kartica deaktivirana.');
        this.load();
      },
      error: () => this.toast.error('Greska pri deaktivaciji kartice.'),
    });
  }

  statusBadgeClass(status: string): string {
    if (status === 'ACTIVE') return 'z-badge z-badge-green';
    if (status === 'BLOCKED') return 'z-badge z-badge-yellow';
    return 'z-badge z-badge-gray';
  }

  statusLabel(status: string): string {
    if (status === 'ACTIVE') return 'Aktivna';
    if (status === 'BLOCKED') return 'Blokirana';
    if (status === 'DEACTIVATED') return 'Deaktivirana';
    return status;
  }

  trackByCard(_: number, card: CardAdminSummary): number {
    return card.id;
  }
}
