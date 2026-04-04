import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Card, CardStatus, CardAction, CardStatusLabels } from '../models/card.model';
import { CardService } from '../services/card.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-account-cards-placeholder',
  templateUrl: './account-cards-placeholder.component.html',
  styleUrls: ['./account-cards-placeholder.component.scss']
})
export class AccountCardsPlaceholderComponent implements OnInit {
  // Account info from query params
  accountNumber = '';
  ownerName = '';
  ownershipType = '';
  accountType = '';
  status = '';

  // Cards data
  cards: Card[] = [];

  // UI state
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Modal state
  showConfirmModal = false;
  selectedCard: Card | null = null;
  pendingAction: CardAction | null = null;
  isProcessing = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly cardService: CardService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadQueryParams();
    this.loadCards();
  }

  private loadQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    this.accountNumber = params.get('accountNumber') || '';
    this.ownerName = params.get('ownerName') || '';
    this.ownershipType = params.get('ownershipType') || '';
    this.accountType = params.get('accountType') || '';
    this.status = params.get('status') || '';
  }

  loadCards(): void {
    if (!this.accountNumber) {
      this.hasError = true;
      this.errorMessage = 'Broj računa nije prosleđen.';
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    this.cardService.getCardsByAccountNumber(this.accountNumber).subscribe({
      next: (cards) => {
        this.cards = cards;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = err.error?.message || 'Greška pri učitavanju kartica.';
        this.toastService.error(this.errorMessage);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  // Status helpers
  getStatusLabel(status: CardStatus): string {
    return CardStatusLabels[status] || status;
  }

  getStatusBadgeClass(status: CardStatus): string {
    switch (status) {
      case 'AKTIVNA': return 'z-badge-green';
      case 'BLOKIRANA': return 'z-badge-red';
      case 'DEAKTIVIRANA': return 'z-badge-gray';
      default: return 'z-badge-gray';
    }
  }

  getCardOwnerFullName(card: Card): string {
    return `${card.ownerFirstName} ${card.ownerLastName}`.trim();
  }

  // Card gradient colors
  getCardGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    return gradients[index % gradients.length];
  }

  // Get total balance of all cards
  getTotalBalance(): number {
    return this.cards.reduce((sum, card) => sum + card.balance, 0);
  }

  // Get active cards only for the summary section
  getActiveCards(): Card[] {
    return this.cards.filter(card => card.status === 'AKTIVNA');
  }

  // Action visibility helpers
  canBlock(card: Card): boolean {
    return card.status === 'AKTIVNA';
  }

  canUnblock(card: Card): boolean {
    return card.status === 'BLOKIRANA';
  }

  canDeactivate(card: Card): boolean {
    return card.status !== 'DEAKTIVIRANA';
  }

  hasAnyAction(card: Card): boolean {
    return this.canBlock(card) || this.canUnblock(card) || this.canDeactivate(card);
  }

  // Modal management
  openConfirmModal(card: Card, action: CardAction): void {
    this.selectedCard = card;
    this.pendingAction = action;
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.selectedCard = null;
    this.pendingAction = null;
    this.isProcessing = false;
  }

  getModalTitle(): string {
    switch (this.pendingAction) {
      case 'BLOCK': return 'Potvrda blokiranja';
      case 'UNBLOCK': return 'Potvrda deblokiranja';
      case 'DEACTIVATE': return 'Potvrda deaktivacije';
      default: return 'Potvrda akcije';
    }
  }

  getModalMessage(): string {
    if (!this.selectedCard) return '';
    const cardNum = this.selectedCard.cardNumber;

    switch (this.pendingAction) {
      case 'BLOCK':
        return `Da li ste sigurni da želite blokirati karticu ${cardNum}?`;
      case 'UNBLOCK':
        return `Da li ste sigurni da želite deblokirati karticu ${cardNum}?`;
      case 'DEACTIVATE':
        return `Da li ste sigurni da želite trajno deaktivirati karticu ${cardNum}? Ova akcija se ne može poništiti.`;
      default:
        return '';
    }
  }

  getConfirmButtonClass(): string {
    return this.pendingAction === 'UNBLOCK' ? 'z-btn-primary' : 'z-btn-destructive';
  }

  confirmAction(): void {
    if (!this.selectedCard || !this.pendingAction || this.isProcessing) return;

    this.isProcessing = true;
    const cardId = this.selectedCard.id;

    let action$;
    let successMessage: string;
    let newStatus: CardStatus;

    switch (this.pendingAction) {
      case 'BLOCK':
        action$ = this.cardService.blockCard(cardId);
        successMessage = 'Kartica je uspešno blokirana. Vlasnik će dobiti obaveštenje putem emaila.';
        newStatus = 'BLOKIRANA';
        break;
      case 'UNBLOCK':
        action$ = this.cardService.unblockCard(cardId);
        successMessage = 'Kartica je uspešno deblokirana. Vlasnik će dobiti obaveštenje putem emaila.';
        newStatus = 'AKTIVNA';
        break;
      case 'DEACTIVATE':
        action$ = this.cardService.deactivateCard(cardId);
        successMessage = 'Kartica je trajno deaktivirana. Vlasnik će dobiti obaveštenje putem emaila.';
        newStatus = 'DEAKTIVIRANA';
        break;
      default:
        return;
    }

    action$.subscribe({
      next: () => {
        const card = this.cards.find(c => c.id === cardId);
        if (card) {
          card.status = newStatus;
        }
        this.toastService.success(successMessage);
        this.closeConfirmModal();
      },
      error: (err) => {
        this.isProcessing = false;
        const errorMsg = err.error?.message || 'Greška pri izvršavanju akcije.';
        this.toastService.error(errorMsg);
      }
    });
  }

  trackByCard(index: number, card: Card): number {
    return card.id;
  }
}
