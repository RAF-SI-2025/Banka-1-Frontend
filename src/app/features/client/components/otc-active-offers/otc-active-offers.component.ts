import { Component, OnInit, OnDestroy, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OtcOfferService } from '../../services/otc-offer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OtcOffer } from '../../models/otc-offer.model';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

interface PriceDeviation {
  percentage: number;
  color: 'green' | 'yellow' | 'red';
}

@Component({
  selector: 'app-otc-active-offers',
  templateUrl: './otc-active-offers.component.html',
  styleUrls: ['./otc-active-offers.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
})
export class OtcActiveOffersComponent implements OnInit, OnDestroy {
  offers: OtcOffer[] = [];
  loading = false;
  error: string | null = null;
  unreadCount = 0;

  // Pagination
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Modal
  selectedOffer: OtcOffer | null = null;
  showModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private otcOfferService: OtcOfferService,
    private authService: AuthService,
    private viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.loadOffers();
    this.loadUnreadCount();

    // Subscribe to unread count changes
    this.otcOfferService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: any) => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Učitava aktivne ponude
   */
  loadOffers(): void {
    this.loading = true;
    this.error = null;

    this.otcOfferService.getActiveOffers(this.page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.offers = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err: any) => {
          this.error = 'Greška pri učitavanju ponuda';
          this.loading = false;
          console.error('Error loading OTC offers:', err);
        },
      });
  }

  /**
   * Učitava broj nepročitanih ponuda
   */
  loadUnreadCount(): void {
    this.otcOfferService.updateUnreadCount();
  }

  /**
   * Otvara modal sa detaljima ponude
   */
  openOfferDetail(offer: OtcOffer): void {
    this.selectedOffer = offer;
    this.showModal = true;

    // Označi ponudu kao pročitanu ako je nepročitana
    if (offer.modifiedBy.id !== this.authService.getUserIdFromToken()) {
      this.otcOfferService.markAsRead(offer.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUnreadCount();
          },
          error: (err: any) => {
            console.error('Error marking offer as read:', err);
          },
        });
    }
  }

  /**
   * Zatvara modal
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedOffer = null;
  }

  /**
   * Osvežava listu nakon akcije
   */
  onOfferUpdated(): void {
    this.closeModal();
    this.loadOffers();
    this.loadUnreadCount();
  }

  /**
   * Određuje boju na osnovu odstupanja cene od tržišne
   * Zelena ≤±5%, žuta ±5-20%, crvena >±20%
   */
  getPriceDeviation(offer: OtcOffer): PriceDeviation {
    if (!offer.currentMarketPrice || offer.currentMarketPrice === 0) {
      return { percentage: 0, color: 'green' };
    }

    const difference = Math.abs(offer.pricePerShare - offer.currentMarketPrice);
    const percentage = (difference / offer.currentMarketPrice) * 100;

    if (percentage <= 5) {
      return { percentage, color: 'green' };
    } else if (percentage <= 20) {
      return { percentage, color: 'yellow' };
    } else {
      return { percentage, color: 'red' };
    }
  }

  /**
   * Vrača CSS klasu za boju cene
   */
  getPriceColorClass(offer: OtcOffer): string {
    const deviation = this.getPriceDeviation(offer);
    switch (deviation.color) {
      case 'green':
        return 'bg-success/10 text-success';
      case 'yellow':
        return 'bg-warning/10 text-warning';
      case 'red':
        return 'bg-destructive/10 text-destructive';
      default:
        return '';
    }
  }

  /**
   * Formatira iznos
   */
  formatAmount(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formatira datum i vreme
   */
  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('sr-RS');
  }

  /**
   * Ide na prethodnu stranicu
   */
  previousPage(): void {
    if (this.page > 0) {
      this.page--;
      this.loadOffers();
    }
  }

  /**
   * Ide na sledeću stranicu
   */
  nextPage(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadOffers();
    }
  }

  /**
   * Vraća naziv banke učesnika
   */
  getCounterpartyBankName(offer: OtcOffer): string {
    return offer.counterparty?.bank?.name || '-';
  }

  /**
   * Vraća puno ime učesnika
   */
  getCounterpartyFullName(offer: OtcOffer): string {
    const user = offer.counterparty?.user;
    if (!user) return '-';
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * Formatira datum
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sr-RS');
  }

  /**
   * Vrača CSS klasu na osnovu status-a ponude
   */
  getStatusBadgeClass(offer: OtcOffer): string {
    switch (offer.status) {
      case 'PENDING':
        return 'bg-info/10 text-info';
      case 'ACCEPTED':
        return 'bg-success/10 text-success';
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive';
      case 'COUNTER_OFFER':
        return 'bg-warning/10 text-warning';
      default:
        return '';
    }
  }

  /**
   * Vraća prikličan tekst za status
   */
  getStatusLabel(offer: OtcOffer): string {
    switch (offer.status) {
      case 'PENDING':
        return 'U pregovorima';
      case 'ACCEPTED':
        return 'Prihvaćena';
      case 'REJECTED':
        return 'Odbijena';
      case 'COUNTER_OFFER':
        return 'Kontraponuda';
      default:
        return offer.status;
    }
  }

  /**
   * Prihvata ponudu iz modala
   */
  acceptOfferModal(): void {
    if (!this.selectedOffer) return;

    this.loading = true;
    this.otcOfferService.acceptOffer(this.selectedOffer.id, this.selectedOffer.premium)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadOffers();
          this.loadUnreadCount();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Greška pri prihvatanju ponude';
          console.error('Error accepting offer:', err);
        },
      });
  }

  /**
   * Odbija ponudu iz modala
   */
  rejectOfferModal(): void {
    if (!this.selectedOffer) return;

    if (!confirm('Sigurno želite da odustanete od ove ponude?')) {
      return;
    }

    this.loading = true;
    this.otcOfferService.rejectOffer(this.selectedOffer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.closeModal();
          this.loadOffers();
          this.loadUnreadCount();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Greška pri odbijanju ponude';
          console.error('Error rejecting offer:', err);
        },
      });
  }
}
