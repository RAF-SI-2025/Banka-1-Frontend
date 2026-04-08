import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  AccountDto,
  AuthorizedPersonGender,
  CardBrand,
  CardRequestRecipientType,
  CardService
} from '../../services/card.service';
import { NavbarComponent } from '@/shared/components/navbar/navbar.component';

type FlowStep = 1 | 2 | 3;
type ResultState = 'success' | 'error' | '';

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './request-card.component.html',
  styleUrls: ['./request-card.component.scss']
})
export class RequestCardComponent implements OnInit {
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';

  public step: FlowStep = 1;
  public resultState: ResultState = '';

  public accounts: AccountDto[] = [];
  public selectedAccountNumber = '';
  public selectedAccount: AccountDto | null = null;

  public cardBrand: CardBrand = 'VISA';
  public cardLimit: number | null = null;

  public recipientType: CardRequestRecipientType = 'OWNER';

  public authorizedPerson = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE' as AuthorizedPersonGender,
    email: '',
    phone: '',
    address: ''
  };

  public verificationCode = '';
  public generatedVerificationCode = '';
  public verificationId: number | null = null;

  public cardCountForSelectedAccount = 0;

  public readonly brandOptions: { value: CardBrand; label: string }[] = [
    { value: 'VISA', label: 'Visa' },
    { value: 'MASTERCARD', label: 'MasterCard' },
    { value: 'DINACARD', label: 'DinaCard' },
    { value: 'AMEX', label: 'AmEx' }
  ];

  public readonly recipientOptions: { value: CardRequestRecipientType; label: string }[] = [
    { value: 'OWNER', label: 'Vlasnik računa' },
    { value: 'AUTHORIZED_PERSON', label: 'Ovlašćeno lice' }
  ];

  public readonly genderOptions: { value: AuthorizedPersonGender; label: string }[] = [
    { value: 'MALE', label: 'Muški' },
    { value: 'FEMALE', label: 'Ženski' },
    { value: 'OTHER', label: 'Drugo' }
  ];

  constructor(private readonly cardService: CardService) {}

  public ngOnInit(): void {
    this.loadAccounts();
  }

  public loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cardService.getMyAccounts().subscribe({
      next: (page) => {
        this.accounts = page.content ?? [];
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Greška pri učitavanju računa.';
        this.isLoading = false;
      }
    });
  }

  public onAccountChange(): void {
    this.selectedAccount =
      this.accounts.find(acc => acc.brojRacuna === this.selectedAccountNumber) || null;

    this.cardCountForSelectedAccount = 0;
    this.errorMessage = '';

    if (!this.selectedAccount) {
      return;
    }

    this.cardService.getAccountDetails(this.selectedAccount.brojRacuna).subscribe({
      next: (details) => {
        this.cardCountForSelectedAccount = details.cards?.length ?? 0;
      },
      error: () => {
        this.cardCountForSelectedAccount = 0;
      }
    });
  }

  public isBusinessSelected(): boolean {
    return !!this.selectedAccount && this.cardService.isBusinessAccount(this.selectedAccount);
  }

  public canContinueToVerification(): boolean {
    if (!this.selectedAccount) {
      return false;
    }

    if (!this.cardBrand || this.cardLimit === null || this.cardLimit <= 0) {
      return false;
    }

    if (!this.isBusinessSelected()) {
      return !this.hasPersonalLimitReached();
    }

    if (this.recipientType === 'OWNER' && this.hasBusinessOwnerLimitReached()) {
      return false;
    }

    if (this.recipientType === 'AUTHORIZED_PERSON') {
      return this.isAuthorizedPersonValid();
    }

    return true;
  }

  public nextFromStepOne(): void {
    this.errorMessage = '';

    if (!this.selectedAccount) {
      this.errorMessage = 'Morate izabrati račun.';
      return;
    }

    if (this.cardLimit === null || this.cardLimit <= 0) {
      this.errorMessage = 'Limit kartice mora biti veći od 0.';
      return;
    }

    if (this.hasPersonalLimitReached()) {
      this.errorMessage = 'Za lični račun već je dostignut maksimalan broj kartica (2).';
      return;
    }

    if (this.hasBusinessOwnerLimitReached()) {
      this.errorMessage = 'Za vlasnika poslovnog računa već postoji kartica.';
      return;
    }

    if (this.isBusinessSelected() && this.recipientType === 'AUTHORIZED_PERSON' && !this.isAuthorizedPersonValid()) {
      this.errorMessage = 'Popunite sva polja za ovlašćeno lice.';
      return;
    }

    this.sendMockVerificationCode();
    this.step = 2;
  }

  public resendVerificationCode(): void {
    this.sendMockVerificationCode();
  }

  public confirmVerification(): void {
    this.errorMessage = '';

    if (!this.verificationCode.trim()) {
      this.errorMessage = 'Unesite verifikacioni kod.';
      return;
    }

    if (this.verificationCode !== this.generatedVerificationCode) {
      this.errorMessage = 'Kod nije ispravan.';
      return;
    }

    this.verificationId = Date.now();

    this.submitRequest();
  }

  public backToStepOne(): void {
    this.step = 1;
    this.errorMessage = '';
  }

  public startNewRequest(): void {
    this.step = 1;
    this.resultState = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.verificationCode = '';
    this.generatedVerificationCode = '';
    this.verificationId = null;
  }

  public getAccountLabel(account: AccountDto): string {
    return this.cardService.formatAccountLabel(account);
  }

  private submitRequest(): void {
    if (!this.selectedAccount || !this.verificationId || this.cardLimit === null) {
      this.errorMessage = 'Nedostaju podaci za slanje zahteva.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (!this.isBusinessSelected()) {
      this.cardService.requestPersonalCard({
        accountNumber: this.selectedAccount.brojRacuna,
        cardBrand: this.cardBrand,
        cardLimit: this.cardLimit,
        verificationId: this.verificationId
      }).subscribe({
        next: (response) => this.handleRequestSuccess(response.message),
        error: (err: HttpErrorResponse) => this.handleRequestError(err)
      });
      return;
    }

    this.cardService.requestBusinessCard({
      accountNumber: this.selectedAccount.brojRacuna,
      recipientType: this.recipientType,
      authorizedPersonId: null,
      authorizedPerson: this.recipientType === 'AUTHORIZED_PERSON'
        ? { ...this.authorizedPerson }
        : null,
      cardBrand: this.cardBrand,
      cardLimit: this.cardLimit,
      verificationId: this.verificationId
    }).subscribe({
      next: (response) => this.handleRequestSuccess(response.message),
      error: (err: HttpErrorResponse) => this.handleRequestError(err)
    });
  }

  private handleRequestSuccess(message?: string): void {
    this.isLoading = false;
    this.resultState = 'success';
    this.successMessage = message || 'Zahtev za novu karticu je uspešno evidentiran.';
    this.step = 3;
  }

  private handleRequestError(err: HttpErrorResponse): void {
    this.isLoading = false;
    this.resultState = 'error';
    this.errorMessage = err.error?.message || 'Došlo je do greške pri kreiranju zahteva.';
    this.step = 3;
  }

  private sendMockVerificationCode(): void {
    this.generatedVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = '';
    this.errorMessage = '';

    // DEV helper dok nema pravog mail servisa
    console.log('Mock verification code:', this.generatedVerificationCode);
  }

  private hasPersonalLimitReached(): boolean {
    return !!this.selectedAccount &&
      !this.isBusinessSelected() &&
      this.cardCountForSelectedAccount >= 2;
  }

  private hasBusinessOwnerLimitReached(): boolean {
    return !!this.selectedAccount &&
      this.isBusinessSelected() &&
      this.recipientType === 'OWNER' &&
      this.cardCountForSelectedAccount >= 1;
  }

  private isAuthorizedPersonValid(): boolean {
    const p = this.authorizedPerson;

    return !!(
      p.firstName.trim() &&
      p.lastName.trim() &&
      p.dateOfBirth &&
      p.gender &&
      p.email.trim() &&
      p.phone.trim() &&
      p.address.trim()
    );
  }
}
