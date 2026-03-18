import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Account, ChangeLimitDto } from '../../models/account.model'; // prilagodi putanju ako treba
import { AccountService } from '../../services/account.service'; // prilagodi putanju
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-change-limit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-limit-modal.component.html',
  styleUrls: ['./change-limit-modal.component.css']
})
export class ChangeLimitModalComponent implements OnInit {
  @Input() public account!: Account;
  @Output() public close = new EventEmitter<void>();
  @Output() public limitUpdated = new EventEmitter<void>();

  public limitForm!: FormGroup;
  public isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Inicijalizuje reaktivnu formu sa trenutnim limitima računa
   */
  private initForm(): void {
    this.limitForm = this.fb.group(
      {
        dailyLimit: [this.account?.dailyLimit || 0, [Validators.required, Validators.min(0)]],
        monthlyLimit: [this.account?.monthlyLimit || 0, [Validators.required, Validators.min(0)]],
        verificationCode: ['', [Validators.required]]
      },
      { validators: this.limitValidator }
    );
  }

  /**
   * Custom validator koji proverava da mesečni limit nije manji od dnevnog
   * @param control AbstractControl forme
   * @returns ValidationErrors ukoliko validacija ne prođe, u suprotnom null
   */
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

    this.isSubmitting = true;
    const formValue = this.limitForm.value;
    
    const payload: ChangeLimitDto = {
      dailyLimit: formValue.dailyLimit,
      monthlyLimit: formValue.monthlyLimit,
      verificationCode: formValue.verificationCode
    };

    this.accountService.changeAccountLimits(this.account.id, payload)
      .subscribe({
        next: () => {
          this.toastService.success('Limiti računa su uspešno ažurirani.');
          this.isSubmitting = false;
          
          this.account.dailyLimit = payload.dailyLimit;
          this.account.monthlyLimit = payload.monthlyLimit;
          
          this.limitUpdated.emit();
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Došlo je do greške prilikom ažuriranja limita.';
          this.toastService.error(errorMessage);
          this.isSubmitting = false;
        }
      });
  }
}