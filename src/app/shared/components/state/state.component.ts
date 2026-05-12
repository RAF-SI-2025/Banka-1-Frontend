import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideIconComponent } from '../../icons/lucide-icon.component';

/**
 * PR_19 C19.5: shared loading/empty/error state komponenta.
 * PR_31 Phase 4: emoji defaults zamenjeni Lucide ikonama (`inbox` za empty,
 * `alerttriangle` za error). Caller moze i dalje da prosledi proizvoljan
 * string preko `[icon]` Input-a — ako je string poznato Lucide ime, render-uje
 * se kao `<lucide-icon>`, inace ide kao text fallback (backwards compat za
 * stare emoji icon prop value-ove ili custom Unicode glyphs).
 *
 * <p>Pre PR_19 svaka feature komponenta je inline definisala svoj loading +
 * empty + error markup ("Ucitavanje...", "Nema podataka.", crvena boja error
 * teksta) sa razlicitim Tailwind utility klasama. Rezultat: nekonzistentan
 * UX preko 30+ stranica.
 *
 * <p>Sada feature komponenta samo render-uje:
 * <pre>
 *   &lt;app-state mode="loading"&gt;Ucitavam fondove...&lt;/app-state&gt;
 *   &lt;app-state mode="empty" icon="inbox" title="Nema fondova"
 *              text="Niste investirali ni u jedan fond."&gt;&lt;/app-state&gt;
 *   &lt;app-state mode="error" title="Greska" [text]="errorMessage"&gt;&lt;/app-state&gt;
 * </pre>
 *
 * <p>Standalone — moze se import-ovati direktno bez SharedModule.
 */
const LUCIDE_NAMES = new Set([
  'home', 'wallet', 'send', 'creditcard', 'piggybank', 'trendingup', 'briefcase',
  'handshake', 'building', 'users', 'shieldcheck', 'receipt', 'gauge',
  'search', 'menu', 'x', 'sun', 'moon', 'monitor', 'bell', 'chevrondown',
  'inbox', 'alerttriangle',
]);

@Component({
  selector: 'app-state',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  template: `
    <div *ngIf="mode === 'loading'" class="z-state-loading" data-testid="state-loading">
      <div class="z-state-loading-spinner" aria-hidden="true"></div>
      <p class="z-state-loading-text">
        <ng-content *ngIf="!text"></ng-content>
        {{ text }}
      </p>
    </div>

    <div *ngIf="mode === 'empty'" class="z-state-empty" data-testid="state-empty">
      <div *ngIf="effectiveIcon" class="z-state-empty-icon" aria-hidden="true">
        <lucide-icon *ngIf="isLucide" [name]="effectiveIcon!" [size]="32"></lucide-icon>
        <span *ngIf="!isLucide">{{ effectiveIcon }}</span>
      </div>
      <h3 *ngIf="title" class="z-state-empty-title">{{ title }}</h3>
      <p class="z-state-empty-text">
        <ng-content *ngIf="!text"></ng-content>
        {{ text }}
      </p>
    </div>

    <div *ngIf="mode === 'error'" class="z-state-error" role="alert" data-testid="state-error">
      <div *ngIf="effectiveIcon" class="z-state-error-icon" aria-hidden="true">
        <lucide-icon *ngIf="isLucide" [name]="effectiveIcon!" [size]="32"></lucide-icon>
        <span *ngIf="!isLucide">{{ effectiveIcon }}</span>
      </div>
      <h3 *ngIf="title" class="z-state-error-title">{{ title || 'Greska' }}</h3>
      <p class="z-state-error-text">
        <ng-content *ngIf="!text"></ng-content>
        {{ text }}
      </p>
    </div>
  `,
})
export class StateComponent {
  @Input() mode: 'loading' | 'empty' | 'error' = 'loading';
  @Input() text?: string;
  @Input() title?: string;
  @Input() icon?: string;

  /**
   * Resolves effective icon name. Caller-prosledjen `icon` ima prioritet;
   * inace default per mode: `inbox` za empty, `alerttriangle` za error.
   * Loading mode ne koristi ikonu (vec spinner).
   */
  get effectiveIcon(): string | undefined {
    if (this.icon) return this.icon;
    if (this.mode === 'empty') return 'inbox';
    if (this.mode === 'error') return 'alerttriangle';
    return undefined;
  }

  /**
   * True ako je `effectiveIcon` poznato Lucide ime. False znaci da je
   * string fallback (emoji ili custom glyph) i ide kroz `<span>{{ }}</span>`.
   */
  get isLucide(): boolean {
    return !!this.effectiveIcon && LUCIDE_NAMES.has(this.effectiveIcon);
  }
}
