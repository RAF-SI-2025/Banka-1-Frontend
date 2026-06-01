import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { VerificationService } from '../../../../shared/services/verification.service';
import { environment } from '../../../../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-modal.component.html',
  styleUrls: ['./verification-modal.component.scss']
})
export class VerificationModalComponent implements OnInit, OnDestroy {
  @Input() operationType: string = 'TRANSFER';
  @Input() relatedEntityId: string = '';

  @Output() confirmed = new EventEmitter<number>();
  @Output() closed = new EventEmitter<void>();

  verificationCode: string = '';
  attempts: number = 0;
  readonly maxAttempts: number = 3;
  isSendingCode = false;
  sessionId: number | null = null;

  private destroy$ = new Subject<void>();
  private completed = false;
  awaitingApproval = false;
  expired = false;
  private pollTimer: any;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private http: HttpClient,
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    this.sendVerificationCode();
  }

  sendVerificationCode(): void {
    this.isSendingCode = true;
    const clientId = this.authService.getUserIdFromToken();
    const clientEmail = this.authService.getLoggedUser()?.email;

    if (!clientId || !clientEmail) {
      this.toastService.error('Nije moguće poslati verifikacioni kod.');
      this.isSendingCode = false;
      return;
    }

    this.http.post<{ sessionId: number }>(
      `${environment.apiUrl}/verification/generate`,
      {
        clientId,
        operationType: this.operationType,
        relatedEntityId: this.relatedEntityId,
        clientEmail
      }
    ).subscribe({
      next: (res) => {
        this.sessionId = res.sessionId;
        this.isSendingCode = false;
        this.toastService.info('Verifikacioni kod je poslat na vaš email.');
        this.startPolling();
        this.setExpiryTimer();
      },
      error: () => {
        this.isSendingCode = false;
        this.toastService.error('Greška pri slanju verifikacionog koda.');
      }
    });
  }

  onConfirm(): void {
    if (!this.verificationCode || this.verificationCode.length < 6 || this.sessionId === null) return;

    this.http.post(
      `${environment.apiUrl}/verification/validate`,
      { sessionId: this.sessionId, code: this.verificationCode },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.complete();
      },
      error: () => {
        this.attempts++;
        if (this.attempts >= this.maxAttempts) {
          this.toastService.error('Transakcija je otkazana zbog previše neuspešnih pokušaja.');
          this.closed.emit();
        } else {
          this.toastService.warning(`Pogrešan kod. Preostalo pokušaja: ${this.maxAttempts - this.attempts}`);
        }
      }
    });
  }

  private startPolling(): void {
    if (this.sessionId === null) return;

    this.awaitingApproval = true;
    this.verificationService.pollStatus(this.sessionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if (res.status === 'VERIFIED') {
          this.complete();
        } else if (res.status === 'EXPIRED' || res.status === 'CANCELLED') {
          this.expire(res.status);
        }
      },
      error: () => {
        // Transient network hiccup — timer keeps polling
      }
    });
  }

  private complete(): void {
    if (this.completed) return;
    this.completed = true;
    this.awaitingApproval = false;
    this.destroy$.next();
    this.confirmed.emit(this.sessionId!);
  }

  private expire(status: string): void {
    this.expired = true;
    this.awaitingApproval = false;
    this.destroy$.next();
    const message = status === 'EXPIRED' ? 'Zahtev je istekao.' : 'Odobravanje je otkazano.';
    this.toastService.error(message);
  }

  private setExpiryTimer(): void {
    this.pollTimer = setTimeout(() => {
      if (!this.completed && this.awaitingApproval) {
        this.expire('EXPIRED');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  onClose(): void {
    this.destroy$.next();
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }
}
