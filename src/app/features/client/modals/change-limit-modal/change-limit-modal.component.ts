import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Account } from '../../models/account.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { VerificationModalComponent } from '../../modals/verification-modal/verification-modal.component';

@Component({
  selector: 'app-change-limit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VerificationModalComponent],
  templateUrl: './change-limit-modal.component.html',
  styleUrls: ['./change-limit-modal.component.css']
})
export class ChangeLimitModalComponent implements OnInit {
  @Input() public account!: Account;
  @Output() public close = new EventEmitter<void>();
  @Output() public limitUpdated = new EventEmitter<void>();

  public limitForm!: FormGroup;
  public isSubmitting = false;
  public showVerificationModal = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastService: ToastService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.limitForm = this.fb.group(
      {
        dailyLimit: [this.account?.dailyLimit || 0, [Validators.required, Validators.min(0)]],
        monthlyLimit: [this.account?.monthlyLimit || 0, [Validators.required, Validators.min(0)]],
      },
      { validators: this.limitValidator }
    );
  }

  private limitValidator(control: AbstractControl): ValidationErrors | null {
    const daily = control.get('dailyLimit')?.value;
    const monthly = control.get('monthlyLimit')?.value;
    if (daily !== null && monthly !== null && monthly < daily) {
      return { invalidLimits: true };
    }
    return null;
  }

  public onClose(): void {
    this.close.emit();
  }

  public onSubmit(): void {
    if (this.limitForm.invalid) {
      this.limitForm.markAllAsTouched();
      return;
    }
    this.showVerificationModal = true;
  }

  public handleVerification(sessionId: number): void {
    this.showVerificationModal = false;
    this.doChangeLimit(sessionId);
  }

  private doChangeLimit(sessionId: number): void {
    this.isSubmitting = true;
    const { dailyLimit, monthlyLimit } = this.limitForm.value;

    this.accountService.changeLimit(
      this.account.accountNumber,
      dailyLimit,
      monthlyLimit,
      sessionId
    ).subscribe({
      next: () => {
        this.toastService.success('Limiti računa su uspešno ažurirani.');
        this.isSubmitting = false;
        this.account.dailyLimit = dailyLimit;
        this.account.monthlyLimit = monthlyLimit;
        this.limitUpdated.emit();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Greška pri ažuriranju limita.';
        this.toastService.error(errorMessage);
        this.isSubmitting = false;
      }
    });
  }
}
