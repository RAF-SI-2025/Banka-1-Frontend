import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Account } from '../../models/account.model';
import { Transaction } from '../../models/transaction.model';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';
import { AccountDetailsModalComponent } from '../../modals/account-details-modal/account-details-modal.component';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  standalone: true,
  imports: [CommonModule, AccountDetailsModalComponent, NavbarComponent],
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit {
  public accounts: Account[] = [];
  public selectedAccount: Account | null = null;
  public detailsAccount: Account | null = null;
  public isDetailsModalOpen = false;
  public isLoading = false;
  public errorMessage = '';
  public transactions: Transaction[] = [];
  public transactionsLoading = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly router: Router,
  ) {}

  public ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Dohvata aktivne račune klijenta i sortira ih po raspoloživom stanju opadajuće.
   * Po defaultu selektuje prvi račun u listi.
   *
   * Napomena:
   * - Aktivna je backend integracija.
   * - Mock podaci su ostavljeni ispod kao zakomentarisana fallback varijanta
   *   koja je koriscnea dok backend nije gotov.
   * - Kada backend bude potpuno stabilan i više ne bude potrebe za lokalnim prikazom,
   *   zakomentarisani mock deo moze da se obrise.
   */
  private loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.accountService.getMyAccounts().subscribe({
      next: (accounts: Account[]) => {
        this.accounts = accounts
          .filter(acc => acc.status === 'ACTIVE')
          .sort((a, b) => b.availableBalance - a.availableBalance);

        if (this.accounts.length > 0) {
          this.selectAccount(this.accounts[0]);
        }

        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          error.error?.error ||
          'Greška pri učitavanju računa. Pokušajte ponovo.';
      }
    });
  }

  /**
   * Selektuje račun i prikazuje njegove transakcije ispod liste.
   * Napomena iz specifikacije: označavanje računa i dugme "Detalji" su dve različite funkcionalnosti.
   */
  public selectAccount(account: Account): void {
    this.selectedAccount = account;
    this.loadTransactions(account.accountNumber);
  }

  /**
   * Proverava da li je dati račun trenutno selektovan.
   */
  public isSelected(account: Account): boolean {
    return this.selectedAccount?.id === account.id;
  }

  /**
   * Otvara modal sa detaljima računa.
   * stopPropagation sprečava da se triggeruje selectAccount.
   */
  public goToDetails(account: Account, event: MouseEvent): void {
    event.stopPropagation();

    this.detailsAccount = account;
    this.isDetailsModalOpen = true;
  }

  /**
   * Zatvara modal sa detaljima računa.
   */
  public closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.detailsAccount = null;
  }

  /**
   * Maskira broj računa — prikazuje samo poslednjih 4 karaktera.
   * Primer: "265000000001111111" → "**** 1111"
   */
  public maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber;
    }

    return `**** ${accountNumber.slice(-4)}`;
  }

  /**
   * Formatira iznos kao valutu bez currency simbola — valutu prikazujemo odvojeno.
   * Primer: 81556.74 → "81.556,74"
   */
  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Vraća CSS klasu za gradijent thumbnail-a na osnovu podvrste računa.
   */
  public getAccountGradient(account: Account): string {
    const map: Record<string, string> = {
      STANDARD: 'thumb--blue',
      SAVINGS: 'thumb--purple',
      PENSION: 'thumb--green',
      YOUTH: 'thumb--pink',
      STUDENT: 'thumb--indigo',
      UNEMPLOYED: 'thumb--teal',
      DOO: 'thumb--orange',
      AD: 'thumb--red',
      FOUNDATION: 'thumb--amber',
      FOREIGN_PERSONAL: 'thumb--cyan',
      FOREIGN_BUSINESS: 'thumb--slate'
    };

    return map[account.subtype] ?? 'thumb--blue';
  }

  /**
   * Vraća human-readable naziv podvrste računa.
   */
  public getAccountLabel(account: Account): string {
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

    return labels[account.subtype] ?? account.name;
  }

  public onCreateAccount(): void {
    this.router.navigate(['/accounts/new']);
  }

  private loadTransactions(accountNumber: string): void {
    this.transactionsLoading = true;
    this.transactions = [];

    this.accountService.getTransactions(+accountNumber, 0, 5).subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data ?? [];
        this.transactionsLoading = false;
      },
      error: () => {
        this.transactions = [];
        this.transactionsLoading = false;
      }
    });
  }

  public formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  public getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'Odobreno',
      PENDING: 'Čekanje',
      FAILED: 'Odbijeno',
      CANCELLED: 'Otkazano'
    };
    return map[status] ?? status;
  }
}
