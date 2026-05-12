import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'banka:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly current$ = new BehaviorSubject<Theme>(this.readInitial());
  private mediaQuery: MediaQueryList | null = null;

  readonly effective$: Observable<EffectiveTheme> = this.current$.pipe(
    map(t => this.resolve(t)),
    distinctUntilChanged()
  );

  constructor() {
    this.applyTheme(this.current$.value);

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.current === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  get current(): Theme {
    return this.current$.value;
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(STORAGE_KEY, theme);
    this.current$.next(theme);
    this.applyTheme(theme);
  }

  /**
   * APP_INITIALIZER hook — triggers DI instantiation pre-render. Telo ostaje
   * prazno jer konstruktor vec primenjuje temu; ne uklanjati: bez ovog poziva
   * lazy DI bi mogao da odlozi `data-theme` atribut posle prvog paint-a.
   */
  init(): void {
    /* no-op by design */
  }

  private readInitial(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      /* localStorage unavailable (SSR / privacy mode) */
    }
    return 'system';
  }

  private resolve(t: Theme): EffectiveTheme {
    if (t === 'light' || t === 'dark') return t;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private applyTheme(t: Theme): void {
    const resolved = this.resolve(t);
    document.documentElement.setAttribute('data-theme', resolved);
  }
}
