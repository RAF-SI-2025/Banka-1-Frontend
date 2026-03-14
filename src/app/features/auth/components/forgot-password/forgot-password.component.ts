import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  public email = '';
  public isLoading = false;
  public errorMessage = '';
  public isSubmitted = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  public onSubmit(): void {
    this.errorMessage = '';

    const trimmedEmail = this.email.trim();

    if (!trimmedEmail) {
      this.errorMessage = 'Email is required.';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(trimmedEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.toastService.success('Reset link has been sent to your email.');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          error.error?.error ||
          'Failed to send reset link. Please try again.';
        this.toastService.error(this.errorMessage);
      }
    });
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
