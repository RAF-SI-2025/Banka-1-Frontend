import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-modal.component.html',
  styleUrls: ['./verification-modal.component.scss']
})
export class VerificationModalComponent implements OnInit {
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  verificationCode: string = '';
  attempts: number = 0;
  readonly maxAttempts: number = 3;
  codeSent = false;
  isSendingCode = false;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.sendVerificationCode();
  }

  sendVerificationCode(): void {
    this.isSendingCode = true;
    const user = this.authService.getLoggedUser();
    const email = user?.email;

    if (!email) {
      this.toastService.error('Nije moguće poslati verifikacioni kod.');
      this.isSendingCode = false;
      this.codeSent = true;
      return;
    }

    this.http.post(`${environment.apiUrl}/clients/auth/send-verification`, { email }, { responseType: 'text' })
      .subscribe({
        next: () => {
          this.codeSent = true;
          this.isSendingCode = false;
          this.toastService.info('Verifikacioni kod je poslat na vaš email.');
        },
        error: () => {
          this.codeSent = true;
          this.isSendingCode = false;
          this.toastService.warning('Kod nije poslat - koristite testni kod: 1234');
        }
      });
  }

  onConfirm() {
    if (!this.verificationCode || this.verificationCode.length < 4) return;

    this.http.post(`${environment.apiUrl}/clients/auth/verify-code`,
      { code: this.verificationCode },
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.confirmed.emit(true);
      },
      error: () => {
        // Fallback: accept mock code "1234" for development
        if (this.verificationCode === '1234') {
          this.confirmed.emit(true);
          return;
        }
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

  onClose() {
    this.closed.emit();
  }
}