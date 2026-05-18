import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  public email = '';
  public password = '';
  public isPasswordVisible = false;
  public isLoading = false;
  public errorMessage = '';

  // Praćenje zaključavanja naloga
  public isAccountLocked = false;
  public lockoutTimeRemaining = 0;
  public emailSentNotification = false;
  public failedAttempts = 0;

  private lockoutTimerInterval: any;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 10;
  private readonly LOCKOUT_STORAGE_KEY = 'login_lockout_';
  private readonly ATTEMPTS_STORAGE_KEY = 'login_attempts_';

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

  ngOnInit(): void {
    this.checkAccountLockStatus();
    // Učitaj broj pokušaja iz LocalStorage
    const savedAttempts = localStorage.getItem(this.ATTEMPTS_STORAGE_KEY);
    if (savedAttempts) {
      this.failedAttempts = parseInt(savedAttempts, 10);
    }
  }

  ngOnDestroy(): void {
    if (this.lockoutTimerInterval) {
      clearInterval(this.lockoutTimerInterval);
    }
  }

  /**
   * Proverava da li je nalog zaključan
   */
  private checkAccountLockStatus(): void {
    const lockoutEndTime = localStorage.getItem(this.LOCKOUT_STORAGE_KEY);
    
    if (lockoutEndTime) {
      const endTime = parseInt(lockoutEndTime, 10);
      const now = Date.now();
      
      if (now < endTime) {
        this.isAccountLocked = true;
        this.startLockoutTimer(endTime);
      } else {
        // Lockout je istekao, čisti storage
        localStorage.removeItem(this.LOCKOUT_STORAGE_KEY);
        localStorage.removeItem(this.ATTEMPTS_STORAGE_KEY);
        this.isAccountLocked = false;
      }
    }
  }

  /**
   * Pokreće odbrojavanja za otključavanje naloga
   */
  private startLockoutTimer(lockoutEndTime: number): void {
    this.updateLockoutTimer(lockoutEndTime);
    
    this.lockoutTimerInterval = setInterval(() => {
      this.updateLockoutTimer(lockoutEndTime);
      
      if (this.lockoutTimeRemaining <= 0) {
        clearInterval(this.lockoutTimerInterval);
        this.unlockAccount();
      }
    }, 1000);
  }

  /**
   * Ažurira preostalo vreme zaključavanja
   */
  private updateLockoutTimer(lockoutEndTime: number): void {
    const now = Date.now();
    this.lockoutTimeRemaining = Math.max(0, Math.ceil((lockoutEndTime - now) / 1000));
  }

  /**
   * Otključava nalog nakon isteka vremena
   */
  private unlockAccount(): void {
    this.isAccountLocked = false;
    this.lockoutTimeRemaining = 0;
    this.failedAttempts = 0;
    this.emailSentNotification = false;
    localStorage.removeItem(this.LOCKOUT_STORAGE_KEY);
    localStorage.removeItem(this.ATTEMPTS_STORAGE_KEY);
    this.toastService.success('Nalog je otključan. Možete se ponovo prijaviti.');
  }

  /**
   * Zaključava nalog nakon 5 neuspešnih pokušaja
   */
  private lockAccount(): void {
    this.isAccountLocked = true;
    this.emailSentNotification = true;
    
    const lockoutEndTime = Date.now() + (this.LOCKOUT_DURATION_MINUTES * 60 * 1000);
    localStorage.setItem(this.LOCKOUT_STORAGE_KEY, lockoutEndTime.toString());
    
    this.startLockoutTimer(lockoutEndTime);
    
    this.toastService.error(
      `Nalog je zaključan nakon ${this.MAX_FAILED_ATTEMPTS} neuspešnih pokušaja. ` +
      `Email sa obaveštenjem i opcijom resetovanja lozinke je poslat.`
    );
  }

  /**
   * Povećava broj neuspešnih pokušaja
   */
  private incrementFailedAttempts(): void {
    this.failedAttempts++;
    localStorage.setItem(this.ATTEMPTS_STORAGE_KEY, this.failedAttempts.toString());
    
    if (this.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      this.lockAccount();
    } else {
      // Prikaži upozorenje sa brojem preostalih pokušaja
      const remainingAttempts = this.MAX_FAILED_ATTEMPTS - this.failedAttempts;
      this.errorMessage = 
        `Pogrešan email ili lozinka. Preostalo je ${remainingAttempts} pokušaja pre zaključavanja naloga.`;
    }
  }

  /**
   * Resetuje brojač neuspešnih pokušaja
   */
  private resetFailedAttempts(): void {
    this.failedAttempts = 0;
    localStorage.removeItem(this.ATTEMPTS_STORAGE_KEY);
  }

  /**
   * Vraća formatiran tekst vremena zaključavanja (MM:SS)
   */
  public getFormattedRemainingTime(): string {
    const minutes = Math.floor(this.lockoutTimeRemaining / 60);
    const seconds = this.lockoutTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  public onSubmit(): void {
    // Proveravamo da li je nalog zaključan
    if (this.isAccountLocked) {
      this.errorMessage = `Nalog je zaključan. Pokušajte ponovo za ${this.getFormattedRemainingTime()}.`;
      return;
    }

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
          this.resetFailedAttempts();
          this.toastService.success('Uspešna prijava.');
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = this.mapLoginError(error);
          this.incrementFailedAttempts();
          this.toastService.error(this.errorMessage);
        },
      });
    } else {
      this.authService.login(trimmedEmail, trimmedPassword).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.resetFailedAttempts();
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
          this.incrementFailedAttempts();
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
