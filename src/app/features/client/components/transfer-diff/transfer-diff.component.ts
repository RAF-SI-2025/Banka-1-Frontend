import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Account } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { TransferService, TransferResponse } from '../../services/transfer.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';

type Step = 'form' | 'confirm' | 'success';

@Component({
  selector: 'app-transfer-diff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VerificationModalComponent],
  templateUrl: './transfer-diff.component.html',
  styleUrls: ['./transfer-diff.component.scss']
})
export class TransferDiffComponent implements OnInit {
  accounts: Account[] = [];
  filteredToAccounts: Account[] = [];
  transferForm!: FormGroup;
  public showVerificationModal = false;

  step: Step = 'form';
  isLoading = true;
  isSubmitting = false;

  selectedFromAccount: Account | null = null;
  selectedToAccount: Account | null = null;
  transferResult: TransferResponse | null = null;

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
      fromAccountNumber: [null, Validators.required],
      toAccountNumber: [null, Validators.required],
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
    const fromNumber = this.transferForm.get('fromAccountNumber')?.value;
    this.selectedFromAccount = this.accounts.find(a => a.accountNumber === fromNumber) || null;

    this.transferForm.patchValue({ toAccountNumber: null });
    this.selectedToAccount = null;

    if (this.selectedFromAccount) {
      this.filteredToAccounts = this.accounts.filter(
        a => a.accountNumber !== this.selectedFromAccount!.accountNumber && a.currency !== this.selectedFromAccount!.currency
      );
    } else {
      this.filteredToAccounts = [];
    }
  }

  onToAccountChange(): void {
    const toNumber = this.transferForm.get('toAccountNumber')?.value;
    this.selectedToAccount = this.accounts.find(a => a.accountNumber === toNumber) || null;
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

  handleVerification(sessionId: number): void {
    this.showVerificationModal = false;
    this.executeTransfer(sessionId);
  }

  private executeTransfer(verificationSessionId: number): void {
    this.isSubmitting = true;

    const payload = {
      fromAccountNumber: this.transferForm.value.fromAccountNumber,
      toAccountNumber: this.transferForm.value.toAccountNumber,
      amount: this.transferForm.value.amount,
      verificationSessionId
    };

    this.transferService.transfer(payload).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.transferResult = result;
        this.step = 'success';
        this.toastService.success('Transfer je uspešno izvršen!');
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Greška prilikom transfera.';
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
    this.transferResult = null;
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
