import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';
import { PaymentRecipient } from '../../models/account.model';
import { ClientService, NewPaymentDto } from '../../services/client.service';
import {
  InterbankPaymentService,
  InterbankPaymentRequest
} from '../../services/interbank-payment.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { NotificationType } from '../../../../shared/models/notification.model';

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
  public transactionError = '';
  public isNewRecipient = false;
  public recipientSaved = false;
  public isSavingRecipient = false;
  public showLimitInfo = false;

  public get selectedAccount(): Account | null {
    const acctNum = this.paymentForm?.value?.senderAccount;
    return this.myAccounts.find((a) => a.accountNumber === acctNum) ?? null;
  }

  /** Valuta racuna posiljaoca (default RSD dok se racuni ne ucitaju). */
  public get senderCurrency(): string {
    return this.selectedAccount?.currency ?? 'RSD';
  }

  /**
   * True kada je racun primaoca u drugoj banci (routing != 111).
   * Tada placanje ide preko novog inter-bank endpointa umesto intra-bank toka.
   */
  public get isCrossBank(): boolean {
    const receiver = this.paymentForm?.value?.receiverAccount;
    return this.interbankService.isForeignAccount(receiver);
  }

  /**
   * FIX 5: medjubankarska placanja su podrzana SAMO u RSD (nema FX na inter-bank
   * sini). Blokira se cross-bank placanje kada racun posiljaoca nije u RSD. (OTC
   * settlement ide drugom putanjom i ostaje USD — ne tice se ovog placanja.)
   */
  public get crossBankNonRsdBlocked(): boolean {
    return this.isCrossBank && this.senderCurrency.trim().toUpperCase() !== 'RSD';
  }

  /** FIX 5: poruka koja se prikazuje kada je cross-bank ne-RSD placanje blokirano. */
  public readonly crossBankRsdOnlyMessage =
    'Međubankarska plaćanja su trenutno podržana samo u RSD.';

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
    private interbankService: InterbankPaymentService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();

    // Brza plaćanja: home → klik na primaoca navigira ovde sa recipientAccount /
    // recipientName u query params. Pre-popunjavamo polja primaoca; korisnik samo
    // unese iznos. (Pre fix-a forma se nije popunjavala jer queryParams nisu čitani.)
    const qp = this.route.snapshot.queryParamMap;
    const recipientAccount = qp.get('recipientAccount');
    const recipientName = qp.get('recipientName');
    if (recipientAccount) {
      this.paymentForm.patchValue({ receiverAccount: recipientAccount });
    }
    if (recipientName) {
      this.paymentForm.patchValue({ receiverName: recipientName });
    }
  }
/**
   * Kreira reaktivnu formu i definiše stroga pravila validacije za svako polje
   * (obavezna polja, tačan broj cifara za račun/šifru, dozvoljeni karakteri).
   */
  private initForm(): void {
    this.paymentForm = this.fb.group({
      senderAccount: ['', Validators.required],
      receiverName: ['', Validators.required],
      // Račun primaoca: 18-34 cifre. Banka 1 računi su 19 cifara, ali cross-bank
      // primaoci imaju druge dužine (npr. Banka 2 = 18 cifara, IBAN do 34).
      receiverAccount: ['', [Validators.required, Validators.pattern('^[0-9]{18,34}$')]],
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
    // FIX 5: blokiraj cross-bank ne-RSD placanje pre verifikacije i slanja.
    if (this.crossBankNonRsdBlocked) {
      this.transactionError = this.crossBankRsdOnlyMessage;
      return;
    }
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
    this.transactionError = '';
    const form = this.paymentForm.value;

    // Racun primaoca u drugoj banci (routing != 111) -> novi inter-bank endpoint.
    // Intra-bank (111) zadrzava postojeci tok placanja.
    if (this.interbankService.isForeignAccount(form.receiverAccount)) {
      this.executeInterbankPayment();
      return;
    }

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
        this.notificationService.addNotification({
          type: NotificationType.PAYMENT,
          title: 'Plaćanje izvršeno',
          message: `Plaćanje od ${this.formatAmount(dto.amount)} sa računa ${dto.fromAccountNumber} primacu ${dto.recipientName} je uspešno izvršeno.`,
          data: { paymentDto: dto }
        });
        this.refreshAccountsSilently();
        this.checkIfNewRecipient(form.senderAccount, form.receiverAccount);
      },
      error: (err: any) => {
        this.transactionError = this.extractErrorMessage(err);
      }
    });
  }

  /**
   * Cross-bank placanje preko POST /api/interbank/payments.
   * `currency` mora da odgovara valuti racuna posiljaoca; `message` je svrha placanja.
   * Iznos se salje kao string (decimal-safe).
   */
  private executeInterbankPayment(): void {
    const form = this.paymentForm.value;

    // FIX 5: defanzivni guard — i ako se nekako stigne dovde, ne salji ne-RSD
    // medjubankarsko placanje (backend ga ionako odbija sa 400 pre 2PC-a).
    if (this.crossBankNonRsdBlocked) {
      this.transactionError = this.crossBankRsdOnlyMessage;
      return;
    }

    const request: InterbankPaymentRequest = {
      fromAccount: form.senderAccount,
      toAccount: form.receiverAccount,
      amount: String(form.amount),
      currency: this.senderCurrency,
      message: form.purpose || undefined
    };

    this.interbankService.sendInterbankPayment(request).subscribe({
      next: () => {
        this.notificationService.addNotification({
          type: NotificationType.PAYMENT,
          title: 'Plaćanje izvršeno',
          message: `Međubankarsko plaćanje od ${this.formatAmount(Number(request.amount))} ${request.currency} sa računa ${request.fromAccount} primacu ${form.receiverName} je uspešno izvršeno.`,
          data: { interbankPayment: request }
        });
        this.refreshAccountsSilently();
        this.checkIfNewRecipient(form.senderAccount, form.receiverAccount);
      },
      error: (err: any) => {
        this.transactionError = this.extractErrorMessage(err);
      }
    });
  }

  /**
   * Mapira backend gresku u korisniku-razumljivu poruku.
   * Podrzava i stari {errorTitle,errorDesc} kontrakt (intra-bank) i novi {error} kontrakt (inter-bank).
   */
  private extractErrorMessage(err: unknown): string {
    const e = (err as { error?: unknown })?.error;
    if (typeof e === 'string') {
      return e || 'Plaćanje nije uspelo. Pokušajte ponovo.';
    }
    const body = e as { errorTitle?: string; errorDesc?: string; error?: string; message?: string } | undefined;
    if (body?.errorTitle && body?.errorDesc) {
      return `${body.errorTitle}: ${body.errorDesc}`;
    }
    return body?.error || body?.message || 'Plaćanje nije uspelo. Pokušajte ponovo.';
  }

  private refreshAccountsSilently(): void {
    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.myAccounts = accounts.filter(acc => acc.status === 'ACTIVE');
      },
      error: () => {}
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