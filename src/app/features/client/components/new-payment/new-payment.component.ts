import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';

@Component({
  selector: 'app-new-payment',
  templateUrl: './new-payment.component.html',
  styleUrls: ['./new-payment.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, VerificationModalComponent] // Uvozimo Navbar da bi stranica bila ista kao lista
})
export class NewPaymentComponent implements OnInit {
  public paymentForm!: FormGroup;
  public myAccounts: Account[] = [];
  public isLoading = true;
  public showVerificationModal = false;
  public transactionSuccess = false;
  public isNewRecipient = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
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
      // Tačno 18 cifara za račun primaoca
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

  public handleVerification(success: boolean): void {
      this.showVerificationModal = false;
      if (success) {
        this.executeTransaction();
      }
    }

    private executeTransaction(): void {
    const receiverAcc = this.paymentForm.get('receiverAccount')?.value;

    // SIMULACIJA: Ovde bi inače išao poziv ka servisu da proveri listu primalaca
    // Za sada simuliramo da račun NIJE u listi ako se ne završava na "000"
    this.isNewRecipient = !receiverAcc.endsWith('000');
    
    this.transactionSuccess = true;
    // Napomena: Ne radimo router.navigate odmah da bi korisnik video opciju za dodavanje
  }
  public saveToRecipients(): void {
    const name = this.paymentForm.get('receiverName')?.value;
    const acc = this.paymentForm.get('receiverAccount')?.value;
    
    console.log('Čuvanje primaoca:', { name, acc });
    alert(`Primalac ${name} je dodat u vašu listu!`);
    
    this.isNewRecipient = false; // Sakrivamo dugme nakon klika
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