import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';
import { PaymentRecipient } from '../../models/account.model';
import { ClientService, NewPaymentDto } from '../../services/client.service';

@Component({
  selector: 'app-new-payment',
  templateUrl: './new-payment.component.html',
  styleUrls: ['./new-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VerificationModalComponent] // Uvozimo Navbar da bi stranica bila ista kao lista
})
export class NewPaymentComponent implements OnInit {
  public paymentForm!: FormGroup;
  public myAccounts: Account[] = [];
  public isLoading = true;
  public showVerificationModal = false;
  public transactionSuccess = false;
  public isNewRecipient = false;
  public recipientSaved = false;
  public isSavingRecipient = false;
  public showLimitInfo = false;

  public get selectedAccount(): Account | null {
    const acctNum = this.paymentForm?.value?.senderAccount;
    return this.myAccounts.find((a) => a.accountNumber === acctNum) ?? null;
  }

  public get remainingDailyLimit(): number {
    const a = this.selectedAccount;
    if (!a) return 0;
    return Math.max(0, (a.dailyLimit ?? 0) - (a.dailySpending ?? 0));
  }

  public get remainingMonthlyLimit(): number {
    const a = this.selectedAccount;
    if (!a) return 0;
    return Math.max(0, (a.monthlyLimit ?? 0) - (a.monthlySpending ?? 0));
  }

  public toggleLimitInfo(): void {
    this.showLimitInfo = !this.showLimitInfo;
  }

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();
  }
/**
   * Kreira reaktivnu formu i definiše stroga pravila validacije za svako polje
   * (obavezna polja, tačan broj cifara za račun/šifru, dozvoljeni karakteri).
   */
  private initForm(): void {
    this.paymentForm = this.fb.group({
      senderAccount: ['', Validators.required],
      receiverName: ['', Validators.required],
      // Tačno 18 cifara za račun primaoca (spec Celina 2: 3 + 4 + 9 + 2 = 18)
      receiverAccount: ['', [Validators.required, Validators.pattern('^[0-9]{18}$')]],
      // Iznos mora biti veći od 0
      amount: ['', [Validators.required, Validators.min(0.01)]],
      // Šifra plaćanja: tačno 3 cifre, default za e-banking je obično 289
      paymentCode: ['289', [Validators.required, Validators.pattern('^[0-9]{3}$')]],
      purpose: ['', Validators.required],
      // Poziv na broj: brojevi i crtice
      referenceNumber: ['', [Validators.pattern('^[0-9\-]+$')]]
    });
  }
/**
   * Preuzima sve aktivne račune ulogovanog korisnika preko servisa.
   * Ukoliko korisnik ima račune, automatski selektuje prvi račun u padajućem meniju forme.
   */
  private loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.myAccounts = accounts.filter(acc => acc.status === 'ACTIVE');

        // Automatski selektuj prvi raspoloživi račun
        if (this.myAccounts.length > 0) {
          this.paymentForm.patchValue({
            senderAccount: this.myAccounts[0].accountNumber
          });
        }
        this.isLoading = false;
      },
      error: () => {

        this.isLoading = false;
        console.error('Greška pri učitavanju računa');
      }
    });
  }
/**
   * Pokreće se klikom na dugme za potvrdu plaćanja.
   * Ako su podaci validni, simulira slanje zahteva i vraća na početnu listu.
   * Ako nisu, prikazuje korisniku sva polja gde je napravio grešku.
   */
  public onSubmit(): void {
    if (this.paymentForm.valid) {
      this.showVerificationModal = true;
    } else {
      this.paymentForm.markAllAsTouched();
    }
  }

  public handleVerification(sessionId: number): void {
    this.showVerificationModal = false;
    this.executeTransaction(sessionId);
  }

  private executeTransaction(verificationSessionId: number): void {
    const form = this.paymentForm.value;

    const dto: NewPaymentDto = {
      fromAccountNumber: form.senderAccount,
      toAccountNumber: form.receiverAccount,
      amount: form.amount,
      recipientName: form.receiverName,
      paymentCode: form.paymentCode,
      referenceNumber: form.referenceNumber || undefined,
      paymentPurpose: form.purpose,
      verificationSessionId
    };

    this.clientService.createPayment(dto).subscribe({
      next: () => {
        this.checkIfNewRecipient(form.senderAccount, form.receiverAccount);
      },
      error: () => {
        this.checkIfNewRecipient(form.senderAccount, form.receiverAccount);
      }
    });
  }

  private checkIfNewRecipient(senderAccount: string, receiverAccount: string): void {
    this.clientService.getAllRecipients(senderAccount).subscribe({
      next: (recipients) => {
        const exists = recipients.some((r: PaymentRecipient) => r.accountNumber === receiverAccount);
        this.isNewRecipient = !exists;
        this.transactionSuccess = true;
      },
      error: () => {
        this.isNewRecipient = true;
        this.transactionSuccess = true;
      }
    });
  }

  
  public saveToRecipients(): void {
    if (this.isSavingRecipient || this.recipientSaved) {
      return;
    }
    const name = (this.paymentForm.value.receiverName ?? '').toString().trim();
    const accountNumber = (this.paymentForm.value.receiverAccount ?? '').toString().trim();
    if (!name || !accountNumber) {
      return;
    }
    this.isSavingRecipient = true;
    this.clientService.createRecipient(name, accountNumber).subscribe({
      next: () => {
        this.isSavingRecipient = false;
        this.recipientSaved = true;
        this.isNewRecipient = false;
      },
      error: () => {
        this.isSavingRecipient = false;
      },
    });
  }
/**
   * Pokreće se klikom na dugme "Odustani" ili "Nazad na listu".
   * Prekida proces plaćanja i preusmerava ruter nazad na stranicu sa računima.
   */
  public onCancel(): void {
    this.router.navigate(['/accounts']);
  }
/**
   * Formatira iznos u srpski standardni format za valute (npr. 1.234,56).
   * @param amount Iznos koji treba formatirati.
   * @returns Formatiran string spremam za prikaz u HTML-u.
   */
  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  /**
   * Maskira broj računa zbog lepšeg prikaza (sakriva središnje cifre).
   * @param accountNumber Pun broj računa (18 cifara).
   * @returns Skraćena verzija (npr. 265...4567).
   */
  public maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber;
    }
    return `${accountNumber.substring(0, 3)}...${accountNumber.slice(-4)}`;
  }
}