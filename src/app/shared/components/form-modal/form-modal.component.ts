import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * PR_19 C19.6: shared form-modal komponenta.
 *
 * <p>Pre PR_19: my-funds component je inline kodirao native HTML modal sa
 * fixed overlay + manual show/hide state + handcrafted Tailwind klasama.
 * Drugi flow-ovi (margin add/withdraw, OTC counter-offer) bi tu istu logiku
 * morali da kopiraju.
 *
 * <p>Sada FormModalComponent enkapsulira:
 * <ul>
 *   <li>Overlay (z-overlay) sa backdrop blur + click-outside close</li>
 *   <li>Modal panel (z-modal sa scale-in animacijom)</li>
 *   <li>Header sa title + close X dugmetom</li>
 *   <li>Body slot za form sadrzaj</li>
 *   <li>Footer slot (default: Otkazi + Potvrdi dugmad)</li>
 *   <li>Loading state (submitting)</li>
 *   <li>Error message linija</li>
 * </ul>
 *
 * <p>Usage:
 * <pre>
 *   &lt;app-form-modal *ngIf="modalOpen"
 *                   title="Uplata u fond" [submitting]="loading"
 *                   [errorMessage]="error"
 *                   (close)="modalOpen=false" (confirm)="onSubmit()"&gt;
 *     &lt;input ...&gt;
 *   &lt;/app-form-modal&gt;
 * </pre>
 */
@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="z-overlay" (click)="onBackdropClick($event)" data-testid="form-modal-overlay">
      <div class="z-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="z-modal-header">
          <h2 class="text-lg font-semibold text-foreground">{{ title }}</h2>
          <button type="button" (click)="close.emit()"
                  [disabled]="submitting"
                  aria-label="Zatvori"
                  class="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div class="z-modal-body">
          <ng-content></ng-content>

          <p *ngIf="errorMessage" class="z-error mt-3" role="alert" data-testid="form-modal-error">
            {{ errorMessage }}
          </p>
        </div>

        <footer class="z-modal-footer">
          <ng-content select="[slot=footer]"></ng-content>
          <ng-container *ngIf="!hasCustomFooter">
            <button type="button" class="z-btn-outline" (click)="close.emit()"
                    [disabled]="submitting"
                    data-testid="form-modal-cancel">
              {{ cancelLabel }}
            </button>
            <button type="button" class="z-btn-primary" (click)="confirm.emit()"
                    [disabled]="submitting"
                    data-testid="form-modal-confirm">
              {{ submitting ? submittingLabel : confirmLabel }}
            </button>
          </ng-container>
        </footer>
      </div>
    </div>
  `,
})
export class FormModalComponent {
  @Input() title = '';
  @Input() submitting = false;
  @Input() errorMessage: string | null = null;
  @Input() confirmLabel = 'Potvrdi';
  @Input() cancelLabel = 'Otkazi';
  @Input() submittingLabel = 'Slanje...';
  /**
   * Set to true ako pozivalac koristi `<button slot="footer">...</button>`
   * umesto default Cancel/Confirm para. Sprecava render default footer-a.
   */
  @Input() hasCustomFooter = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.submitting) {
      this.close.emit();
    }
  }
}
