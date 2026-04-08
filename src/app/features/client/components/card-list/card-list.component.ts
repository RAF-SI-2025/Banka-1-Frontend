import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { CardService, AccountDto } from '../../services/card.service';
import { Card } from '../../models/card.model';
import { BlockCardDialogComponent } from '../../modals/block-card-dialog/block-card-dialog.component';
import {RouterModule} from "@angular/router";

export interface CardGroup {
  accountName: string;
  accountNumber: string;
  cards: Card[];
}

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BlockCardDialogComponent, RouterModule],
  templateUrl: './card-list.component.html',
  styles: [`:host { display: block; }

  .thumb--blue    { background: linear-gradient(135deg, #667eea, #764ba2); }
  .thumb--purple  { background: linear-gradient(135deg, #a855f7, #6366f1); }
  .thumb--green   { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .thumb--pink    { background: linear-gradient(135deg, #ec4899, #f43f5e); }
  .thumb--indigo  { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  .thumb--teal    { background: linear-gradient(135deg, #14b8a6, #0891b2); }
  .thumb--orange  { background: linear-gradient(135deg, #f97316, #ea580c); }
  .thumb--red     { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .thumb--cyan    { background: linear-gradient(135deg, #06b6d4, #0891b2); }
  .thumb--slate   { background: linear-gradient(135deg, #64748b, #475569); }
  `]
})
export class CardListComponent implements OnInit {
  groupedCards: CardGroup[] = [];
  isLoading = true;
  errorMessage = '';

  showBlockDialog = false;
  cardToBlock: Card | null = null;

  constructor(private readonly cardService: CardService) {}

  public ngOnInit(): void {
    this.loadAllCards();
  }

  public loadAllCards(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.groupedCards = [];

    this.cardService.getMyAccounts().pipe(
      switchMap(accountPage => {
        const accounts = accountPage.content ?? [];
        if (accounts.length === 0) return of([]);

        const detailRequests = accounts.map((acc: AccountDto) =>
          this.cardService.getAccountDetails(acc.brojRacuna).pipe(
            catchError(() => of(null)),
            switchMap(details => {
              if (!details || !details.cards?.length) return of(null);

              const group: CardGroup = {
                accountName: acc.nazivRacuna,
                accountNumber: acc.brojRacuna,
                cards: details.cards.map((card: Card) => ({
                  ...card,
                  accountName: acc.nazivRacuna,
                  accountNumber: acc.brojRacuna
                }))
              };

              return of(group);
            })
          )
        );

        return forkJoin(detailRequests);
      }),
      catchError((err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Greška pri učitavanju kartica. Pokušajte ponovo.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe({
      next: (results: any) => {
        this.groupedCards = (results as (CardGroup | null)[])
          .filter((g): g is CardGroup => g !== null);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Greška pri učitavanju kartica. Pokušajte ponovo.';
        this.isLoading = false;
      }
    });
  }

  public onBlockCard(card: Card): void {
    this.cardToBlock = card;
    this.showBlockDialog = true;
  }

  public onConfirmBlock(): void {
    if (!this.cardToBlock) return;

    this.cardService.blockCard(this.cardToBlock.cardNumber).subscribe({
      next: () => {
        this.onCancelAction();
        this.loadAllCards();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Greška pri blokiranju kartice.';
        this.onCancelAction();
      }
    });
  }

  public onCancelAction(): void {
    this.showBlockDialog = false;
    this.cardToBlock = null;
  }


  public maskCardNumber(cardNumber: string): string {
    return this.cardService.maskCardNumber(cardNumber);
  }

  public getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Aktivna',
      BLOCKED: 'Blokirana',
      EXPIRED: 'Deaktivirana',
      CANCELLED: 'Deaktivirana'
    };
    return map[status] ?? status;
  }

  public getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'z-badge-green',
      BLOCKED: 'z-badge-red',
      EXPIRED: 'z-badge-gray',
      CANCELLED: 'z-badge-gray'
    };
    return map[status] ?? 'z-badge-gray';
  }

  public getCardTypeLabel(cardType: string): string {
    const map: Record<string, string> = {
      DEBIT: 'Debitna',
      CREDIT: 'Kreditna',
      PREPAID: 'Prepaid'
    };
    return map[cardType] ?? cardType;
  }

  public getCardBrand(card: Card): string {
    const num = card.cardNumber.replace(/\D/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MC';
    if (num.startsWith('9891')) return 'DINA';
    if (num.startsWith('34') || num.startsWith('37')) return 'AMEX';
    return card.cardType.slice(0, 4);
  }

  public getCardGradient(card: Card): string {
    const num = card.cardNumber.replace(/\D/g, '');
    if (num.startsWith('4')) return 'thumb--blue';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'thumb--orange';
    if (num.startsWith('9891')) return 'thumb--red';
    if (num.startsWith('34') || num.startsWith('37')) return 'thumb--indigo';
    return 'thumb--teal';
  }
}
