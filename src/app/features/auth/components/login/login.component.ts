import { Component } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public email = '';
  public password = '';
  public isPasswordVisible = false;
  public isLoading = false;
  public errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  public onSubmit(): void {
    this.errorMessage = '';

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isLoading = true;

    this.authService.login(trimmedEmail, trimmedPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Successfully signed in.');
        this.router.navigate(['/employees']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          error.error?.error ||
          'Login failed. Please check your credentials.';
        this.toastService.error(this.errorMessage);
      }
    });
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  public goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  public goToLanding(): void {
    this.router.navigate(['/']);
  }
}
