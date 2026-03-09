import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth';

/**
 * Forgot password component for initiating password reset.
 * Sends reset link to user's email address.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  standalone: true,
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  forgotPasswordForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Handles form submission for password reset request.
   */
  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Always show success message (security best practice)
          this.successMessage.set('If an account exists with this email, you will receive a password reset link.');
          this.forgotPasswordForm.reset();
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'An error occurred. Please try again.');
        }
      });
  }

  /**
   * Checks if a form field has an error and has been touched.
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return field ? field.hasError(errorType) && field.touched : false;
  }

  /**
   * Checks if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
