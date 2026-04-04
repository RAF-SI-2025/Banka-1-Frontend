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
      this.errorMessage = 'Email i lozinka su obavezni.';
      return;
    }

    this.isLoading = true;

    // Prvo pokušaj kao klijent, pa ako ne uspe kao zaposleni
    this.authService.loginClient(trimmedEmail, trimmedPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success('Uspešna prijava.');
        this.router.navigate(['/home']);
      },
      error: () => {
        // Klijentski login nije uspeo, pokušaj kao zaposleni
        this.authService.login(trimmedEmail, trimmedPassword).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.toastService.success('Uspešna prijava.');
            const perms = res.permissions || [];
            if (perms.includes('EMPLOYEE_MANAGE_ALL')) {
              this.router.navigate(['/employees']);
            } else {
              this.router.navigate(['/clients']);
            }
          },
          error: (error: HttpErrorResponse) => {
            this.isLoading = false;
            this.errorMessage =
              error.error?.message ||
              error.error?.error ||
              'Prijava neuspešna. Proverite vaše podatke.';
            this.toastService.error(this.errorMessage);
          }
        });
      }
    });
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  public goToForgotPassword(): void {
    this.router.navigate(['auth/forgot-password']);
  }

  public goToLanding(): void {
    this.router.navigate(['/']);
  }
}
