import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Account } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { TransferService } from '../../services/transfer.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';

type Step = 'form' | 'confirm' | 'success';

@Component({
  selector: 'app-transfer-same',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, VerificationModalComponent],
  templateUrl: './transfer-same.component.html',
  styleUrls: ['./transfer-same.component.scss']
})
export class TransferSameComponent implements OnInit {
  accounts: Account[] = [];
  filteredToAccounts: Account[] = [];
  transferForm!: FormGroup;
  public showVerificationModal = false;

  step: Step = 'form';
  isLoading = true;
  isSubmitting = false;
  noMatchMessage = '';

  selectedFromAccount: Account | null = null;
  selectedToAccount: Account | null = null;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private transferService: TransferService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.transferForm = this.fb.group({
      fromAccountId: [null, Validators.required],
      toAccountId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]]
    });

    this.accountService.getMyAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts.filter(a => a.status === 'ACTIVE');
        this.isLoading = false;
      },
      error: () => {
        this.toastService.error('Greška prilikom učitavanja računa.');
        this.isLoading = false;
      }
    });
  }

  onFromAccountChange(): void {
    const fromId = this.transferForm.get('fromAccountId')?.value;
    this.selectedFromAccount = this.accounts.find(a => a.id === +fromId) || null;

    this.transferForm.patchValue({ toAccountId: null });
    this.selectedToAccount = null;
    this.noMatchMessage = '';

    if (this.selectedFromAccount) {
      this.filteredToAccounts = this.accounts.filter(
        a => a.id !== this.selectedFromAccount!.id && a.currency === this.selectedFromAccount!.currency
      );

      if (this.filteredToAccounts.length === 0) {
        this.noMatchMessage = 'Nemate dva računa iste valute za prenos.';
      }
    } else {
      this.filteredToAccounts = [];
    }
  }

  onToAccountChange(): void {
    const toId = this.transferForm.get('toAccountId')?.value;
    this.selectedToAccount = this.accounts.find(a => a.id === +toId) || null;
  }

  get amountError(): string {
    const ctrl = this.transferForm.get('amount');
    if (!ctrl || !ctrl.touched) return '';
    if (ctrl.hasError('required')) return 'Iznos je obavezan.';
    if (ctrl.hasError('min')) return 'Iznos mora biti veći od 0.';
    if (ctrl.hasError('exceedsBalance')) return 'Iznos prelazi raspoloživo stanje.';
    return '';
  }

  onContinue(): void {
    // Validate amount against available balance
    const amount = this.transferForm.get('amount')?.value;
    if (this.selectedFromAccount && amount > this.selectedFromAccount.availableBalance) {
      this.transferForm.get('amount')?.setErrors({ exceedsBalance: true });
      this.transferForm.get('amount')?.markAsTouched();
      return;
    }

    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }

    this.step = 'confirm';
  }

  onBack(): void {
    this.step = 'form';
  }

  onConfirm(): void {
    this.showVerificationModal = true;
  }

  handleVerification(success: boolean): void {
    this.showVerificationModal = false;
    if (success) {
      this.executeTransfer();
    }
  }

  private executeTransfer(): void {
    this.isSubmitting = true;

    const payload = {
      fromAccountId: +this.transferForm.value.fromAccountId,
      toAccountId: +this.transferForm.value.toAccountId,
      amount: this.transferForm.value.amount
    };

    this.transferService.transferSameCurrency(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.step = 'success';
        this.toastService.success('Prenos je uspešno izvršen!');
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Greška prilikom prenosa.';
        this.toastService.error(msg);
      }
    });
  }

  onNewTransfer(): void {
    this.step = 'form';
    this.transferForm.reset();
    this.selectedFromAccount = null;
    this.selectedToAccount = null;
    this.filteredToAccounts = [];
    this.noMatchMessage = '';
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatAccountLabel(account: Account): string {
    return `${account.name} - ${account.accountNumber} (${this.formatCurrency(account.availableBalance, account.currency)})`;
  }
}
