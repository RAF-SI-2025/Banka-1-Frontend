import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { StateComponent } from '../../shared/components/state/state.component';
import { AppPaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LucideIconComponent } from '../../shared/icons/lucide-icon.component';
import { ToastService } from '../../shared/services/toast.service';

/**
 * WP-21 (Celina 2): full in-app notifications page (`/notifications`).
 *
 * <p>Server-paginated list of the caller's notification feed (newest first)
 * with a per-row "mark as read" action and a global "mark all read" button.
 * Reachable by every authenticated user — no extra permission — both from
 * the route and from the topbar bell panel "see all" link.
 *
 * <p>Standalone, lazy-loaded via `loadComponent` so it stays out of the
 * initial bundle.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    StateComponent,
    AppPaginationComponent,
    LucideIconComponent,
  ],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  totalElements = 0;
  pageSize = 10;
  /** 0-indexed page number (matches the Spring Data `Page` envelope). */
  currentPage = 0;

  isLoading = true;
  error: string | null = null;
  /** True while a mark-all-read request is in flight. */
  markingAll = false;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.notificationService.list(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.notifications = page?.content ?? [];
        this.totalElements = page?.totalElements ?? 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Greska pri ucitavanju notifikacija.';
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.load();
  }

  /** Number of unread notifications on the current page. */
  get unreadOnPage(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markRead(n: Notification): void {
    if (n.read) {
      return;
    }
    this.notificationService.markRead(n.id).subscribe({
      next: () => {
        /* Optimistic local flip — avoids a full page reload. */
        n.read = true;
      },
      error: () => this.toast.error('Greska pri oznacavanju notifikacije.'),
    });
  }

  markAllRead(): void {
    if (this.markingAll || this.unreadOnPage === 0) {
      return;
    }
    this.markingAll = true;
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.markingAll = false;
        this.toast.success('Sve notifikacije su oznacene kao procitane.');
        this.load();
      },
      error: () => {
        this.markingAll = false;
        this.toast.error('Greska pri oznacavanju notifikacija.');
      },
    });
  }

  trackByNotification(_: number, n: Notification): number {
    return n.id;
  }
}
