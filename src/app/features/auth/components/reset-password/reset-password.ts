import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Reset password component for setting a new password via reset link.
 * Includes password strength validation and confirmation matching.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  resetPasswordForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  tokenError = signal<string | null>(null);

  private token = '';

  constructor() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Extract token from URL query parameters
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.token = params['token'] || '';
        if (!this.token) {
          this.tokenError.set('Invalid or missing reset token. Please request a new password reset link.');
        }
      });
  }

  /**
   * Custom validator for password strength.
   * Requires: uppercase, lowercase, number, special character.
   */
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUppercase && hasLowercase && hasNumber && hasSpecial;
    return valid ? null : { passwordStrength: true };
  }

  /**
   * Custom validator to ensure passwords match.
   */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Toggles new password visibility.
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  /**
   * Toggles confirm password visibility.
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(value => !value);
  }

  /**
   * Handles form submission for password reset.
   */
  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage.set('Invalid reset token. Please request a new password reset link.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token, newPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error?.error?.message || 'Failed to reset password. Please try again.');
        }
      });
  }

  /**
   * Checks if a form field has an error and has been touched.
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return field ? field.hasError(errorType) && field.touched : false;
  }

  /**
   * Checks if a form field is invalid and has been touched.
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  /**
   * Checks if passwords don't match.
   */
  hasPasswordMismatch(): boolean {
    return this.resetPasswordForm.hasError('passwordMismatch') &&
           this.resetPasswordForm.get('confirmPassword')?.touched === true;
  }

  /**
   * Password constraint checkers for visual indicators.
   */
  get hasMinLength(): boolean {
    const value = this.resetPasswordForm.get('newPassword')?.value || '';
    return value.length >= 8;
  }

  get hasUppercase(): boolean {
    const value = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(value);
  }

  get hasLowercase(): boolean {
    const value = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(value);
  }

  get hasNumber(): boolean {
    const value = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[0-9]/.test(value);
  }

  get hasSpecialChar(): boolean {
    const value = this.resetPasswordForm.get('newPassword')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(value);
  }
}
