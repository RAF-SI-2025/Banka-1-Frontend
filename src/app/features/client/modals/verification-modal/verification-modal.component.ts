import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-modal.component.html',
  styleUrls: ['./verification-modal.component.scss']
})
export class VerificationModalComponent {
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  verificationCode: string = '';
  attempts: number = 0;
  readonly correctCode: string = '1234';
  readonly maxAttempts: number = 3;

  constructor(private toastService: ToastService) {}

  onConfirm() {
    if (this.verificationCode === this.correctCode) {
      this.confirmed.emit(true);
    } else {
      this.attempts++;
      if (this.attempts >= this.maxAttempts) {
        this.toastService.error('Transakcija je otkazana zbog previše neuspešnih pokušaja.');
        this.closed.emit();
      } else {
        this.toastService.warning(`Pogrešan kod. Preostalo pokušaja: ${this.maxAttempts - this.attempts}`);
      }
    }
  }

  onClose() {
    this.closed.emit();
  }
}