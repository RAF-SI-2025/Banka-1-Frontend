import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  permissions: string[];
}

export interface RefreshResponse {
  token: string;
}

export interface LoggedUser {
  email: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'loggedUser';

  constructor(private router: Router, private http: HttpClient) {}

  /**
   * Prijavljuje korisnika sa email-om i lozinkom.
   * Nakon uspešnog logina, JWT token i podaci o korisniku se čuvaju u localStorage.
   * @param email - Email adresa korisnika
   * @param password - Lozinka korisnika
   * @returns Observable sa JWT tokenom i listom permisija
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify({ email, permissions: res.permissions }));
        }),
        catchError(err => throwError(() => err))
      );
  }

  /**
   * Odjavljuje korisnika tako što briše JWT token i podatke o korisniku iz localStorage,
   * a zatim preusmerava na login stranicu.
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Osvežava JWT token slanjem zahteva na refresh endpoint.
   * Novi token se automatski čuva u localStorage.
   * U slučaju greške, korisnik se odjavljuje.
   * @returns Observable sa novim JWT tokenom
   */
  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Sends forgot password request to the server.
   * @param email - Email address for password reset
   * @returns Observable with response message
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Resets password using the token from email link.
   * @param token - Reset token from URL
   * @param password - New password
   * @returns Observable with response message
   */
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    const id = this.getIdFromToken(token);
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/resetPassword`, { id, password });
  }

  /**
   * Activates account and sets initial password.
   * @param token - Activation token from URL
   * @param password - New password
   * @returns Observable with response message
   */
  activateAccount(token: string, password: string): Observable<{ message: string }> {
    const id = this.getIdFromToken(token);
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/activate`, { id, password });
  }

  /**
   * Proverava da li je korisnik trenutno autentifikovan
   * na osnovu prisustva JWT tokena u localStorage.
   * @returns true ako token postoji, false inače
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Returns the JWT token from localStorage.
   * @returns JWT token or null
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getIdFromToken(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      const parsed = JSON.parse(decoded);
      return parsed.id ?? null;
    } catch (e) {
      console.error('Failed to extract id from token', e);
      return null;
    }
  }

  /**
   * Vraća podatke o ulogovanom korisniku iz localStorage.
   * @returns Objekat sa email-om i permisijama, ili null ako korisnik nije ulogovan
   */
  getLoggedUser(): LoggedUser | null {
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
}
