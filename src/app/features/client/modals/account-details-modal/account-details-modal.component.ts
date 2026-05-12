import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Account } from '../../models/account.model';
import { RenameAccountComponent } from '../../components/rename-account/rename-account.component';
import { ChangeLimitModalComponent } from '../change-limit-modal/change-limit-modal.component';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
@Component({
  selector: 'app-account-details-modal',
  templateUrl: './account-details-modal.component.html',
  standalone: true,
  imports: [CommonModule, RenameAccountComponent, ChangeLimitModalComponent],
  styleUrls: ['./account-details-modal.component.scss']
})
export class AccountDetailsModalComponent implements OnInit {
  @Input() public account: Account | null = null;
  @Input() public allAccounts: Account[] = [];
  @Output() public close = new EventEmitter<void>();

  public isBusinessAccount(): boolean {
    if (!this.account) {
      return false;
    }

    return ['DOO', 'AD', 'FOUNDATION', 'FOREIGN_BUSINESS'].includes(this.account.subtype);
  }

  constructor(
    private router: Router,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Spec Celina 2: "Promenu limita moze uraditi samo vlasnik racuna." Za poslovne
   * racune, OvlascenoLice nije vlasnik pa ne sme videti dugme.
   */
  public get isOwner(): boolean {
    const currentUserId = this.authService.getUserIdFromToken();
    return !!this.account && currentUserId !== null && this.account.ownerId === currentUserId;
  }

  public statusLabel(): string {
    if (!this.account) return '';
    const raw = (this.account as any).status ?? (this.account as any).accountStatus ?? '';
    if (typeof raw !== 'string') return '';
    const upper = raw.toUpperCase();
    if (upper === 'ACTIVE' || upper === 'AKTIVAN' || upper === 'AKTIVNA') return 'Aktivan';
    if (upper === 'INACTIVE' || upper === 'NEAKTIVAN' || upper === 'NEAKTIVNA' || upper === 'BLOCKED' || upper === 'BLOKIRAN') return 'Neaktivan';
    return raw;
  }

  public ngOnInit(): void {
    if (this.account?.accountNumber) {
      this.accountService.getAccountByNumber(this.account.accountNumber).subscribe({
        next: (fullAccount) => {
          this.account = { ...fullAccount, name: fullAccount.name || this.account!.name };
        },
        error: (err) => console.error('Failed to load account details', err)
      });
    }
  }

  public getModalSubtitle(): string {
    return this.isBusinessAccount()
      ? 'Business account overview'
      : 'Personal account overview';
  }

  // Flag za prikaz F5 modala
  public showRenameModal = false;


  public closeModal(): void {
    this.close.emit();
  }

  // F5: Otvaramo modal za promenu naziva
  public onChangeAccountName(): void {
    this.showRenameModal = true;
  }

  // Metoda koja prihvata novo ime iz deteta i ažurira prikaz
  public onNameUpdated(newName: string): void {
    if (this.account) {
      this.account.name = newName;
    }
    this.showRenameModal = false;
  }

  // Navigate to new payment page
  public onNewPayment(): void {
    this.closeModal();
    this.router.navigate(['/accounts/payment/new']);
  }

  public isChangeLimitModalOpen = false;

  /**
   * Otvara modal za promenu limita računa
   */
  public onChangeLimit(): void {
    this.isChangeLimitModalOpen = true;
  }

  /**
   * Zatvara modal za promenu limita
   */
  public closeChangeLimitModal(): void {
    this.isChangeLimitModalOpen = false;
  }

  /**
   * Reaguje kada su limiti uspešno promenjeni
   */
  public onLimitUpdated(): void {
    this.isChangeLimitModalOpen = false;
    // Zatvaramo i glavni modal da bi se podaci osvežili u parent listi,
    // ili možeš da ne zatvaraš nego samo ostaviš emit
    this.closeModal();
  }

  /**
   * Vraća naziv tipa računa za detaljan prikaz.
   */
  public getAccountTypeLabel(): string {
    if (!this.account) return '';

    const labels: Record<string, string> = {
      STANDARD: 'Standardni tekući',
      SAVINGS: 'Štedni',
      PENSION: 'Penzionerski',
      YOUTH: 'Za mlade',
      STUDENT: 'Za studente',
      UNEMPLOYED: 'Za nezaposlene',
      DOO: 'Poslovni (DOO)',
      AD: 'Poslovni (AD)',
      FOUNDATION: 'Fondacija',
      FOREIGN_PERSONAL: 'Devizni lični',
      FOREIGN_BUSINESS: 'Devizni poslovni'
    };
    return labels[this.account.subtype] ?? this.account.name;
  }

  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}
