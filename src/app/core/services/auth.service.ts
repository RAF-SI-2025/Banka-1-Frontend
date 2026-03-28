import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {tap, catchError} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

type LoginResponse = {
  jwt: string;
  refreshToken: string;
  role: string;
  permissions: string[];
};
type ClientLoginResponse = {
  token: string;
};
type RefreshResponse = {
  jwt: string;
  refreshToken: string;
  role: string;
  permissions: string[];
};

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'loggedUser';

  constructor(private router: Router, private http: HttpClient) {
  }

  /**
   * Prijavljuje zaposlenog sa email-om i lozinkom.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/employees/auth/login`, {email, password})
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.jwt);
          localStorage.setItem('refreshToken', res.refreshToken);
          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify({
              email,
              role: res.role,
              permissions: res.permissions
            })
          );
        })
      );
  }

  /**
   * Prijavljuje klijenta sa email-om i lozinkom.
   */
  loginClient(email: string, password: string): Observable<ClientLoginResponse> {
    return this.http
      .post<ClientLoginResponse>(`${environment.apiUrl}/clients/auth/login`, {email, password})
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);

          // Izvuci ulogu iz JWT tokena
          let role = 'CLIENT';
          try {
            const payload = JSON.parse(atob(res.token.split('.')[1]));
            role = payload.roles ?? 'CLIENT';
          } catch (_) {}

          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify({
              email,
              role,
              permissions: ['BANKING_BASIC']
            })
          );
        })
      );
  }

  /**
   * Vraća ulogu korisnika.
   */
  getUserRole(): string {
    const user = this.getLoggedUser();
    return (user as any)?.role ?? '';
  }

  /**
   * Da li je ulogovani korisnik klijent.
   */
  isClient(): boolean {
    const role = this.getUserRole().toUpperCase();
    return role.startsWith('CLIENT');
  }

  /**
   * Odjavljuje korisnika tako što briše JWT token i podatke o korisniku iz localStorage,
   * a zatim preusmerava na login stranicu.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }

  /**
   * Sends forgot password request for the provided email.
   * @param email User email address
   * @returns Observable with text response message
   */
  public forgotPassword(email: string): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/employees/auth/forgot-password`,
      { email },
      { responseType: 'text' as 'json' }
    );
  }

  /**
   * Validates reset password confirmation token and returns confirmation id.
   * @param confirmationToken Token from reset password email link
   */
  public checkResetPasswordToken(confirmationToken: string): Observable<number> {
    return this.http.get<number>(
      `${environment.apiUrl}/employees/auth/checkResetPassword`,
      {
        params: { confirmationToken }
      }
    );
  }

  /**
   * Sends reset password request.
   * @param id Confirmation id returned by checkResetPassword endpoint
   * @param confirmationToken Token from URL
   * @param password New password
   */
  public resetPassword(
    id: number,
    confirmationToken: string,
    password: string
  ): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/employees/auth/resetPassword`, {
      id,
      confirmationToken,
      password
    },
    { responseType: 'text' as 'json' }
    );
  }

  /**
   * Validates activate confirmation token and returns confirmation id.
   * @param confirmationToken Token from activation email link
   */
  public checkActivateToken(confirmationToken: string): Observable<number> {
    return this.http.get<number>(
      `${environment.apiUrl}/employees/auth/checkActivate`,
      {
        params: { confirmationToken }
      }
    );
  }

  /**
   * Sends activate account request.
   * @param id Confirmation id returned by checkActivate endpoint
   * @param confirmationToken Token from URL
   * @param password New password
   */
  public activateAccount(
    id: number,
    confirmationToken: string,
    password: string
  ): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/employees/auth/activate`, {
      id,
      confirmationToken,
      password
    },
    { responseType: 'text' as 'json' }
    );
  }

  /**
   * Osvežava JWT token slanjem zahteva na refresh endpoint.
   * Novi token se automatski čuva u localStorage.
   * U slučaju greške, korisnik se odjavljuje.
   * @returns Observable sa novim JWT tokenom
   */
  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.jwt);
          localStorage.setItem('refreshToken', res.refreshToken);

          const user = this.getLoggedUser();
          localStorage.setItem(
            this.USER_KEY,
            JSON.stringify({
              email: user?.email ?? '',
              role: res.role,
              permissions: res.permissions
            })
          );
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Proverava da li je korisnik trenutno autentifikovan
   * na osnovu prisustva i validnosti JWT tokena u localStorage.
   * @returns true ako token postoji i nije istekao, false inače
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // exp je u sekundama
      return Date.now() < expiry;
    } catch {
      return false;
    }
  }

  /**
   * Vraća JWT token iz localStorage.
   * Enkapsulira direktan pristup localStorage-u — koristi se u interceptoru.
   * @returns JWT token string ili null ako ne postoji
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Extracts user id from JWT payload stored in localStorage.
   * @returns User id or null if token is missing/invalid
   */
  public getUserIdFromToken(): number | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payloadPart = token.split('.')[1];

      if (!payloadPart) {
        return null;
      }

      const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(normalizedPayload);
      const payload = JSON.parse(decodedPayload) as { id?: number | string };

      if (payload.id === undefined || payload.id === null) {
        return null;
      }

      const parsedId = Number(payload.id);

      return Number.isNaN(parsedId) ? null : parsedId;
    } catch {
      return null;
    }
  }

  /**
   * Vraća podatke o ulogovanom korisniku iz localStorage.
   * @returns Objekat sa email-om i permisijama, ili null ako korisnik nije ulogovan
   */
  getLoggedUser(): { email: string; permissions: string[] } | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Proverava da li ulogovani korisnik ima određenu permisiju.
   * @param permission - Naziv permisije koja se proverava
   * @returns true ako korisnik ima permisiju, false inače
   */
  hasPermission(permission: string): boolean {
    const user = this.getLoggedUser();
    return !!user?.permissions?.includes(permission);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
