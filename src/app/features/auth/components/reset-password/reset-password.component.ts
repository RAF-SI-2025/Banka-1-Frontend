import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  public password = '';
  public confirmPassword = '';

  public isPasswordVisible = false;
  public isConfirmPasswordVisible = false;
  public isLoading = false;

  public hasValidResetToken = false;
  public successMessage = '';
  public generalErrorMessage = '';

  public passwordTouched = false;
  public confirmPasswordTouched = false;

  public passwordErrorMessage = '';
  public confirmPasswordErrorMessage = '';

  private confirmationToken = '';
  private resetId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  public ngOnInit(): void {
    this.confirmationToken = this.activatedRoute.snapshot.queryParamMap.get('token') ?? '';

    if (!this.confirmationToken.trim()) {
      this.hasValidResetToken = false;
      this.generalErrorMessage = 'This page must be opened using the password reset link sent to your email.';
      return;
    }

    this.isLoading = true;

    this.authService.checkResetPasswordToken(this.confirmationToken).subscribe({
      next: (id: number) => {
        this.resetId = id;
        this.hasValidResetToken = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.hasValidResetToken = false;
        this.isLoading = false;
        this.generalErrorMessage = error.error?.message || 'This reset password link is invalid or expired.';
        this.toastService.error(this.generalErrorMessage);
      }
    });
  }

  public togglePasswordVisibility(): void { this.isPasswordVisible = !this.isPasswordVisible; }
  public toggleConfirmPasswordVisibility(): void { this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible; }

  public goToForgotPassword(): void { this.router.navigate(['/forgot-password']); }
  public goToLogin(): void { this.router.navigate(['/login']); }

  public onPasswordBlur(): void {
    this.passwordTouched = true;
    this.validatePasswordField();
    this.validateConfirmPasswordField();
  }

  public onConfirmPasswordBlur(): void {
    this.confirmPasswordTouched = true;
    this.validateConfirmPasswordField();
  }

  public onPasswordInput(): void {
    if (this.passwordTouched) this.validatePasswordField();
    if (this.confirmPasswordTouched) this.validateConfirmPasswordField();
  }

  public onConfirmPasswordInput(): void {
    if (this.confirmPasswordTouched) this.validateConfirmPasswordField();
  }

  // Password strength
  public get strengthScore(): number {
    let score = 0;
    const p = this.password;
    if (p.length >= 8) score += 20;
    if (p.length >= 16) score += 10;
    if (/[a-z]/.test(p)) score += 15;
    if (/[A-Z]/.test(p)) score += 15;
    const digits = p.match(/\d/g);
    if (digits && digits.length >= 2) score += 20;
    if (/[^a-zA-Z0-9]/.test(p)) score += 20;
    return score;
  }

  public get strengthPercent(): number { return this.strengthScore; }

  public get strengthLabel(): string {
    const s = this.strengthScore;
    if (s < 40) return 'Weak';
    if (s < 60) return 'Medium';
    if (s < 80) return 'Good';
    return 'Strong';
  }

  public get strengthClass(): string {
    const s = this.strengthScore;
    if (s < 40) return 'strength-weak';
    if (s < 60) return 'strength-medium';
    if (s < 80) return 'strength-good';
    return 'strength-strong';
  }

  public get hasMinLength(): boolean { return this.password.length >= 8; }
  public get hasMaxLength(): boolean { return this.password.length <= 32; }
  public get hasUppercaseLetter(): boolean { return /[A-Z]/.test(this.password); }
  public get hasLowercaseLetter(): boolean { return /[a-z]/.test(this.password); }
  public get hasTwoDigits(): boolean { const m = this.password.match(/\d/g); return !!m && m.length >= 2; }
  public get hasNoSpaces(): boolean { return !/\s/.test(this.password); }

  public get isFormValid(): boolean {
    return this.hasValidResetToken &&
      this.password.length > 0 &&
      this.confirmPassword.length > 0 &&
      !this.getPasswordValidationMessage(this.password) &&
      !this.getConfirmPasswordValidationMessage(this.password, this.confirmPassword);
  }

  public onSubmit(): void {
    this.successMessage = '';
    this.generalErrorMessage = '';
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;
    this.validatePasswordField();
    this.validateConfirmPasswordField();

    if (!this.hasValidResetToken || this.resetId === null) {
      this.generalErrorMessage = 'This reset password link is invalid or expired.';
      return;
    }

    if (this.passwordErrorMessage || this.confirmPasswordErrorMessage) return;

    this.isLoading = true;

    this.authService.resetPassword(this.resetId, this.confirmationToken, this.password.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password successfully reset.';
        this.toastService.success('Password successfully reset. Redirecting...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.generalErrorMessage = error.error?.message || error.error?.error || 'Failed to reset password. Please try again.';
        this.toastService.error(this.generalErrorMessage);
      }
    });
  }

  private validatePasswordField(): void {
    this.passwordErrorMessage = this.getPasswordValidationMessage(this.password);
  }

  private validateConfirmPasswordField(): void {
    this.confirmPasswordErrorMessage = this.getConfirmPasswordValidationMessage(this.password, this.confirmPassword);
  }

  private getPasswordValidationMessage(password: string): string {
    const p = password.trim();
    if (!p) return 'Password is required.';
    if (p.length < 8) return 'Password must be at least 8 characters.';
    if (p.length > 32) return 'Password must be at most 32 characters.';
    if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(p)) return 'Password must contain at least one lowercase letter.';
    const digits = p.match(/\d/g);
    if (!digits || digits.length < 2) return 'Password must contain at least two digits.';
    if (/\s/.test(p)) return 'Password must not contain spaces.';
    return '';
  }

  private getConfirmPasswordValidationMessage(password: string, confirmPassword: string): string {
    const cp = confirmPassword.trim();
    if (!cp) return 'Please confirm your password.';
    if (password.trim() !== cp) return 'Passwords do not match.';
    return '';
  }
}
