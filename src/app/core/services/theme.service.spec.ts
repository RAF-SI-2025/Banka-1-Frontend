import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';

/**
 * Helper to stub window.matchMedia for deterministic OS-preference tests.
 * Karma runs in a real browser whose prefers-color-scheme depends on the host OS,
 * so we override matchMedia per spec.
 */
function stubMatchMedia(prefersDark: boolean): jasmine.Spy {
  return spyOn(window, 'matchMedia').and.callFake((query: string) => {
    const matches = query.includes('dark') ? prefersDark : !prefersDark;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => { /* legacy */ },
      removeListener: () => { /* legacy */ },
      addEventListener: () => { /* no-op */ },
      removeEventListener: () => { /* no-op */ },
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
}

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('default theme is "system" when nothing in storage', () => {
    stubMatchMedia(false);
    service = TestBed.inject(ThemeService);
    expect(service.current).toBe('system');
  });

  it('reads persisted theme from localStorage', () => {
    stubMatchMedia(false);
    localStorage.setItem('banka:theme', 'dark');
    const newService = new ThemeService();
    expect(newService.current).toBe('dark');
  });

  it('setTheme("dark") sets data-theme="dark" on <html>', () => {
    stubMatchMedia(false);
    service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('banka:theme')).toBe('dark');
  });

  it('setTheme("light") sets data-theme="light"', () => {
    stubMatchMedia(true);
    service = TestBed.inject(ThemeService);
    service.setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme("system") resolves to OS preference (light when prefers-color-scheme=light)', () => {
    stubMatchMedia(false);
    service = TestBed.inject(ThemeService);
    service.setTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('banka:theme')).toBe('system');
  });

  it('effective$ emits resolved theme', (done) => {
    stubMatchMedia(false);
    service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    service.effective$.subscribe(t => {
      expect(t).toBe('dark');
      done();
    });
  });
});
