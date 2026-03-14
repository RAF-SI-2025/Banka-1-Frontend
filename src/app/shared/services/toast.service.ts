import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  removing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private toastsSubject = new Subject<Toast[]>();
  toasts$ = this.toastsSubject.asObservable();

  private toasts: Toast[] = [];

  success(message: string): void {
    this.addToast('success', message);
  }

  error(message: string): void {
    this.addToast('error', message);
  }

  warning(message: string): void {
    this.addToast('warning', message);
  }

  info(message: string): void {
    this.addToast('info', message);
  }

  private addToast(type: Toast['type'], message: string): void {
    const toast: Toast = { id: ++this.counter, type, message };
    this.toasts = [...this.toasts, toast];
    this.toastsSubject.next(this.toasts);

    setTimeout(() => this.removeToast(toast.id), 4500);
  }

  removeToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.removing = true;
      this.toastsSubject.next([...this.toasts]);

      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.toastsSubject.next(this.toasts);
      }, 250);
    }
  }
}
