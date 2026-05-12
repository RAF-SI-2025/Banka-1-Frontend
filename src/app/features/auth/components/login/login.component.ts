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

  /**
   * PR_31: Eksplicitan toggle "Klijent" / "Zaposleni". Pre toga, login flow je
   * uvek prvo pokusavao klijent endpoint pa zaposleni kao fallback — sto je
   * onemogucavalo testiranje zaposlenog koji ima isti email kao klijent
   * (uvek bi se logovao kao klijent). Sad korisnik bira eksplicitno.
   */
  public loginType: 'client' | 'employee' = 'client';

  public selectLoginType(type: 'client' | 'employee'): void {
    this.loginType = type;
    this.errorMessage = '';
  }

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

    if (this.loginType === 'client') {
      this.authService.loginClient(trimmedEmail, trimmedPassword).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.success('Uspešna prijava.');
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = this.mapLoginError(error);
          this.toastService.error(this.errorMessage);
        },
      });
    } else {
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
          this.errorMessage = this.mapLoginError(error);
          this.toastService.error(this.errorMessage);
        },
      });
    }
  }

  /**
   * Mapira HTTP gresku na spec-tacnu poruku iz TestoviCelina1 (Sc 2 i Sc 3):
   * "Korisnik ne postoji" za 404 / USER_NOT_FOUND, "Neispravni unos" za pogresan password.
   * Ostale greske vracaju backend message ili generican fallback.
   */
  private mapLoginError(error: HttpErrorResponse): string {
    const code = (error.error?.code ?? error.error?.error ?? '').toString().toUpperCase();
    const status = error.status;
    const lockoutHints = ['USER_LOCKED', 'ACCOUNT_LOCKED', 'TOO_MANY_ATTEMPTS'];
    if (lockoutHints.includes(code)) {
      return 'Nalog je privremeno zaključan zbog previše neuspešnih pokušaja.';
    }
    if (code === 'USER_NOT_FOUND' || status === 404) {
      return 'Korisnik ne postoji';
    }
    if (
      code === 'INVALID_CREDENTIALS' ||
      code === 'BAD_CREDENTIALS' ||
      status === 401 ||
      status === 403
    ) {
      return 'Neispravni unos';
    }
    return error.error?.message || error.error?.error || 'Prijava neuspešna. Proverite vaše podatke.';
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
