import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OtcOfferService } from '../../services/otc-offer.service';
import { OtcOffer } from '../../models/otc-offer.model';

interface ModalState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

@Component({
  selector: 'app-otc-offer-detail',
  templateUrl: './otc-offer-detail.component.html',
  styleUrls: ['./otc-offer-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class OtcOfferDetailComponent implements OnInit, OnDestroy {
  @Input() offer!: OtcOffer;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  state: ModalState = {
    loading: false,
    error: null,
    success: null,
  };

  // Forme
  counterOfferForm!: FormGroup;
  acceptForm!: FormGroup;

  // Modal view state
  activeTab: 'view' | 'counter' = 'view';

  // Expose Math for template
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(private otcOfferService: OtcOfferService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicijalizuje forme
   */
  private initForms(): void {
    // Counter Offer forma
    this.counterOfferForm = this.fb.group({
      quantity: [this.offer.quantity, [Validators.required, Validators.min(1)]],
      pricePerShare: [this.offer.pricePerShare, [Validators.required, Validators.min(0.01)]],
      premium: [this.offer.premium, [Validators.required]],
      settlementDate: [this.offer.settlementDate, [Validators.required]],
    });

    // Accept forma
    this.acceptForm = this.fb.group({
      premiumAmount: [this.offer.premium, [Validators.required, Validators.min(0.01)]],
    });
  }

  /**
   * Prihvata ponudu - pokreće kreiranje opcionalnog ugovora i isplatu premije
   */
  acceptOffer(): void {
    if (!this.acceptForm.valid) {
      this.state.error = 'Molimo ispunite sve obavezne polje';
      return;
    }

    this.state.loading = true;
    this.state.error = null;
    this.state.success = null;

    const premiumAmount = this.acceptForm.get('premiumAmount')?.value;

    this.otcOfferService.acceptOffer(this.offer.id, premiumAmount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state.loading = false;
          this.state.success = 'Ponuda je prihvaćena. Opcioni ugovor je kreiran.';
          setTimeout(() => {
            this.updated.emit();
          }, 1500);
        },
        error: (err: any) => {
          this.state.loading = false;
          this.state.error = err.error?.message || 'Greška pri prihvatanju ponude';
          console.error('Error accepting offer:', err);
        },
      });
  }

  /**
   * Odustaje od ponude
   */
  rejectOffer(): void {
    if (!confirm('Sigurno želite da odustanete od ove ponude?')) {
      return;
    }

    this.state.loading = true;
    this.state.error = null;
    this.state.success = null;

    this.otcOfferService.rejectOffer(this.offer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state.loading = false;
          this.state.success = 'Ponuda je odbijena';
          setTimeout(() => {
            this.updated.emit();
          }, 1500);
        },
        error: (err: any) => {
          this.state.loading = false;
          this.state.error = err.error?.message || 'Greška pri odbijanju ponude';
          console.error('Error rejecting offer:', err);
        },
      });
  }

  /**
   * Šalje kontraponudu
   */
  sendCounterOffer(): void {
    if (!this.counterOfferForm.valid) {
      this.state.error = 'Molimo ispunite sve obavezne polje';
      return;
    }

    this.state.loading = true;
    this.state.error = null;
    this.state.success = null;

    const formValue = this.counterOfferForm.value;
    const request = {
      otcOfferId: this.offer.id,
      ...formValue,
    };

    this.otcOfferService.sendCounterOffer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.state.loading = false;
          this.state.success = 'Kontraponuda je poslata';
          setTimeout(() => {
            this.updated.emit();
          }, 1500);
        },
        error: (err: any) => {
          this.state.loading = false;
          this.state.error = err.error?.message || 'Greška pri slanju kontraponude';
          console.error('Error sending counter offer:', err);
        },
      });
  }

  /**
   * Zatvara modal
   */
  closeModal(): void {
    this.close.emit();
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
   * Formatira datum
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sr-RS');
  }

  /**
   * Dodeljuje CSS klasu na osnovu status-a ponude
   */
  getStatusBadgeClass(): string {
    switch (this.offer.status) {
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
  getStatusLabel(): string {
    switch (this.offer.status) {
      case 'PENDING':
        return 'U pregovorima';
      case 'ACCEPTED':
        return 'Prihvaćena';
      case 'REJECTED':
        return 'Odbijena';
      case 'COUNTER_OFFER':
        return 'Kontraponuda';
      default:
        return this.offer.status;
    }
  }

  /**
   * Vrača puno ime drugog učesnika
   */
  getCounterpartyName(): string {
    const user = this.offer.counterparty?.user;
    if (!user) return '-';
    return `${user.firstName} ${user.lastName}`;
  }

  /**
   * Vrača naziv banke drugog učesnika
   */
  getCounterpartyBank(): string {
    return this.offer.counterparty?.bank?.name || '-';
  }
}
