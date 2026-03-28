import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { AccountService } from '../../services/account.service';
import { PaymentRecipient } from '../../models/account.model';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';

type FormMode = 'add' | 'edit' | null;

@Component({
  selector: 'app-payment-recipients',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './payment-recipients.component.html',
  styleUrls: ['./payment-recipients.component.scss']
})
export class PaymentRecipientsComponent implements OnInit {
  public recipients: PaymentRecipient[] = [];
  public filteredRecipients: PaymentRecipient[] = [];
  public isLoading = false;

  public searchQuery = '';
  public accountNumber = '';
  public page = 0;
  public size = 10;

  public formMode: FormMode = null;
  public formName = '';
  public formAccountNumber = '';
  public formError = '';
  public formLoading = false;
  private editingId: number | null = null;

  constructor(
    private readonly clientService: ClientService,
    private readonly accountService: AccountService
  ) {}

  public ngOnInit(): void {
    this.loadAccountAndRecipients();
  }

  /**
   * Loads the user's account to get the account number, then loads recipients.
   */
  private loadAccountAndRecipients(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        if (accounts.length > 0) {
          this.accountNumber = accounts[0].accountNumber;
          this.loadRecipients();
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Dohvata sve primaоce plaćanja za dati račun.
   */
  private loadRecipients(): void {
    this.isLoading = true;

    this.clientService.getAllRecipients(this.accountNumber, this.page, this.size).subscribe({
      next: (recipients: PaymentRecipient[]) => {
        this.recipients = recipients;
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => {
        this.recipients = [];
        this.applyFilter();
        this.isLoading = false;
      }
    });
  }

  /** Filtrira primaоce po imenu ili broju računa. */
  public onSearch(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredRecipients = q
      ? this.recipients.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.accountNumber.toLowerCase().includes(q)
      )
      : [...this.recipients];
  }

  /** Otvara formu za dodavanje novog primaoca. */
  public openAddForm(): void {
    this.formMode = 'add';
    this.formName = '';
    this.formAccountNumber = '';
    this.formError = '';
    this.editingId = null;
  }

  /**
   * Otvara formu za izmenu postojećeg primaoca.
   * @param recipient - Primalac koji se menja
   */
  public openEditForm(recipient: PaymentRecipient): void {
    this.formMode = 'edit';
    this.formName = recipient.name;
    this.formAccountNumber = recipient.accountNumber;
    this.formError = '';
    this.editingId = recipient.id;
  }

  /** Zatvara formu i resetuje stanje. */
  public closeForm(): void {
    this.formMode = null;
    this.formName = '';
    this.formAccountNumber = '';
    this.formError = '';
    this.editingId = null;
  }

  /** Validira i čuva primaoca (dodavanje ili izmena). */
  public saveRecipient(): void {
    this.formError = '';

    const name = this.formName.trim();
    const accountNumber = this.formAccountNumber.trim();

    if (!name) {
      this.formError = 'Naziv je obavezan.';
      return;
    }
    if (!accountNumber) {
      this.formError = 'Broj računa je obavezan.';
      return;
    }

    this.formLoading = true;

    if (this.formMode === 'add') {
      // TODO: dodati backend endpoint za cuvanje primaoca placanja
      const created: PaymentRecipient = { id: Date.now(), name, accountNumber };
      this.recipients.push(created);
      this.applyFilter();
      this.closeForm();
      this.formLoading = false;
    } else if (this.formMode === 'edit' && this.editingId !== null) {
      this.clientService.updateRecipient(this.editingId, name, accountNumber).subscribe({
        next: (updated: PaymentRecipient) => {
          const index = this.recipients.findIndex(r => r.id === this.editingId);
          if (index !== -1) this.recipients[index] = updated;
          this.applyFilter();
          this.closeForm();
          this.formLoading = false;
        },
        error: () => {
          this.applyFilter();
          this.closeForm();
          this.formLoading = false;
        }
      });
    }
  }

  /**
   * Briše primaoca plaćanja.
   * @param recipient - Primalac koji se briše
   */
  public deleteRecipient(recipient: PaymentRecipient): void {
    this.clientService.deleteRecipient(recipient.id).subscribe({
      next: () => {
        this.recipients = this.recipients.filter(r => r.id !== recipient.id);
        this.applyFilter();
      },
      error: () => {
        // TODO: ukloniti mock kada backend bude spreman
        this.recipients = this.recipients.filter(r => r.id !== recipient.id);
        this.applyFilter();
      }
    });
  }

  /** Ukupan broj primaoca. */
  public get totalCount(): number {
    return this.filteredRecipients.length;
  }
}
