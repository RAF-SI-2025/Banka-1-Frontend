import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Jednostavan ETag keš za GET JSON endpoint-e (F11 poll / OTC lista).
 * Ako server vrati 304 Not Modified, vraća poslednji uspešan odgovor.
 */
export class OtcEtagCache {
  private readonly etags = new Map<string, string>();
  private readonly bodies = new Map<string, unknown>();

  constructor(private readonly http: HttpClient) {}

  getJson<T>(url: string): Observable<T> {
    let headers = new HttpHeaders();
    const etag = this.etags.get(url);
    if (etag) {
      headers = headers.set('If-None-Match', etag);
    }

    return this.http.get<T>(url, { observe: 'response', headers }).pipe(
      map((res) => {
        this.store(url, res.headers.get('ETag') ?? res.headers.get('etag'), res.body);
        return res.body as T;
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 304) {
          const cached = this.bodies.get(url);
          if (cached !== undefined) {
            return of(cached as T);
          }
        }
        return throwError(() => err);
      }),
    );
  }

  invalidateUrl(url: string): void {
    this.etags.delete(url);
    this.bodies.delete(url);
  }

  /** Npr. posle accept/counter — sledeći poll mora dohvatiti sveže podatke. */
  invalidateByPrefix(urlPrefix: string): void {
    for (const key of [...this.etags.keys()]) {
      if (key.startsWith(urlPrefix) || key.includes(urlPrefix)) {
        this.invalidateUrl(key);
      }
    }
  }

  clear(): void {
    this.etags.clear();
    this.bodies.clear();
  }

  hasCached(url: string): boolean {
    return this.bodies.has(url);
  }

  private store(url: string, etag: string | null, body: unknown): void {
    if (etag) {
      this.etags.set(url, etag);
    }
    if (body !== undefined && body !== null) {
      this.bodies.set(url, body);
    }
  }
}
