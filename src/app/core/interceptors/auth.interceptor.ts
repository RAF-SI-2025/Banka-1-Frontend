  import { Injectable } from '@angular/core';
  import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse
  } from '@angular/common/http';
  import { Observable, throwError, BehaviorSubject } from 'rxjs';
  import { catchError, filter, switchMap, take } from 'rxjs/operators';
  import { AuthService } from '../services/auth.service';

  @Injectable()
  export class AuthInterceptor implements HttpInterceptor {

    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);

    constructor(private authService: AuthService) {}

    /**
     * Returns true if request should be sent without JWT Authorization header.
     * @param url Request URL
     */
    private shouldSkipAuthHeader(url: string): boolean {
      return (
        url.includes('/auth/login') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/resetPassword') ||
        url.includes('/auth/activate') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/check-activate') ||
        url.includes('/auth/resend-activation')
      );
    }

    /**
     * Interceptuje svaki HTTP zahtev i dodaje Authorization header sa JWT tokenom.
     * Ukoliko server vrati 401, pokušava da osveži token i ponovi originalni zahtev.
     * @param req - Originalni HTTP zahtev
     * @param next - Sledeći handler u lancu
     * @returns Observable sa HTTP eventom
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const token = this.authService.getToken();

      if (!token || this.shouldSkipAuthHeader(req.url)) {
        return next.handle(req);
      }

      return next.handle(this.addToken(req, token)).pipe(
        catchError(err => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            return this.handle401(req, next);
          }
          return throwError(() => err);
        })
      );
    }

    /**
     * Klonira zahtev i dodaje Authorization: Bearer header.
     * @param req - Originalni HTTP zahtev
     * @param token - JWT token
     * @returns Klonirani zahtev sa Authorization headerom
     */
    private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
      return req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    /**
     * Upravlja 401 greškom — osvežava token i ponavlja originalni zahtev.
     * Ako je refresh već u toku, čeka na novi token pa tek onda ponavlja zahtev.
     * @param req - Originalni HTTP zahtev koji je vratio 401
     * @param next - Sledeći handler u lancu
     * @returns Observable sa ponovljenim HTTP zahtevom
     */
    private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshTokenSubject.next(null);

        return this.authService.refreshToken().pipe(
          switchMap(res => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(res.jwt);
            return next.handle(this.addToken(req, res.jwt));
          }),
          catchError(err => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next('');

            this.authService.logout();
            return throwError(() => err);
          })
        );
      }
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }
  }
