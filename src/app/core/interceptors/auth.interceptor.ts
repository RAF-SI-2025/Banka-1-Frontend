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
   * Interceptuje svaki HTTP zahtev i dodaje Authorization header sa JWT tokenom.
   * Ukoliko server vrati 401, pokušava da osveži token i ponovi originalni zahtev.
   * @param req - Originalni HTTP zahtev
   * @param next - Sledeći handler u lancu
   * @returns Observable sa HTTP eventom
   */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    // Ne kači token na login, refresh, forgot-password, reset-password i activate endpointe
    const excludedUrls = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/activate'];
    const isExcluded = excludedUrls.some(url => req.url.includes(url));

    if (!token || isExcluded) {
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
  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
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
  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(res => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(res.token);
          return next.handle(this.addToken(req, res.token));
        }),
        catchError(err => {
          this.isRefreshing = false;
          return throwError(() => err);
        })
      );
    }

    // Ako je refresh već u toku, sačekaj novi token pa ponovi zahtev
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addToken(req, token!)))
    );
  }
}
