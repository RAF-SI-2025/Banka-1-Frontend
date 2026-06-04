import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationStatus, NotificationType } from '../../models/notification.model';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;

  private destroy$ = new Subject<void>();

  NotificationType = NotificationType;
  NotificationStatus = NotificationStatus;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.subscribeToChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Učitaj notifikacije
   */
  private loadNotifications(): void {
    this.notificationService.getActiveNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
  }

  /**
   * Pretplaćuj se na promene
   */
  private subscribeToChanges(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  /**
   * Označite notifikaciju kao pročitanu
   */
  markAsRead(notification: Notification): void {
    if (notification.status !== NotificationStatus.READ) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  /**
   * Označi sve notifikacije kao pročitane
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  /**
   * Obriši notifikaciju
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id);
  }

  /**
   * Obriši sve notifikacije
   */
  deleteAll(): void {
    if (confirm('Jeste li sigurni da želite da obriešete sve notifikacije?')) {
      this.notificationService.deleteAll();
    }
  }

  /**
   * Pronađi ikonu na osnovu tipa notifikacije
   */
  getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
      [NotificationType.PAYMENT]: 'payments',
      [NotificationType.TRANSFER]: 'compare_arrows',
      [NotificationType.LIMIT_CHANGE]: 'trending_up',
      [NotificationType.CARD_BLOCKED]: 'block',
      [NotificationType.LOAN_CREATED]: 'description',
      [NotificationType.LOAN_APPROVED]: 'check_circle',
      [NotificationType.LOAN_REJECTED]: 'cancel',
      [NotificationType.ORDER_PENDING]: 'schedule',
      [NotificationType.ORDER_APPROVED]: 'done',
      [NotificationType.ORDER_REJECTED]: 'close',
      [NotificationType.ORDER_COMPLETED]: 'check_circle',
      [NotificationType.ORDER_PARTIAL_FILL]: 'assignment_turned_in',
      [NotificationType.ORDER_CANCELLED]: 'cancel',
    };
    return iconMap[type] || 'notifications';
  }

  /**
   * Pronađi boju na osnovu tipa notifikacije
   */
  getNotificationColor(type: NotificationType): string {
    const colorMap: Record<NotificationType, string> = {
      [NotificationType.PAYMENT]: 'text-green-600',
      [NotificationType.TRANSFER]: 'text-blue-600',
      [NotificationType.LIMIT_CHANGE]: 'text-yellow-600',
      [NotificationType.CARD_BLOCKED]: 'text-red-600',
      [NotificationType.LOAN_CREATED]: 'text-purple-600',
      [NotificationType.LOAN_APPROVED]: 'text-green-600',
      [NotificationType.LOAN_REJECTED]: 'text-red-600',
      [NotificationType.ORDER_PENDING]: 'text-yellow-600',
      [NotificationType.ORDER_APPROVED]: 'text-green-600',
      [NotificationType.ORDER_REJECTED]: 'text-red-600',
      [NotificationType.ORDER_COMPLETED]: 'text-green-600',
      [NotificationType.ORDER_PARTIAL_FILL]: 'text-blue-600',
      [NotificationType.ORDER_CANCELLED]: 'text-red-600',
    };
    return colorMap[type] || 'text-gray-600';
  }

  /**
   * Pronađi background boju na osnovu tipa notifikacije
   */
  getNotificationBgColor(type: NotificationType): string {
    const colorMap: Record<NotificationType, string> = {
      [NotificationType.PAYMENT]: 'bg-green-50',
      [NotificationType.TRANSFER]: 'bg-blue-50',
      [NotificationType.LIMIT_CHANGE]: 'bg-yellow-50',
      [NotificationType.CARD_BLOCKED]: 'bg-red-50',
      [NotificationType.LOAN_CREATED]: 'bg-purple-50',
      [NotificationType.LOAN_APPROVED]: 'bg-green-50',
      [NotificationType.LOAN_REJECTED]: 'bg-red-50',
      [NotificationType.ORDER_PENDING]: 'bg-yellow-50',
      [NotificationType.ORDER_APPROVED]: 'bg-green-50',
      [NotificationType.ORDER_REJECTED]: 'bg-red-50',
      [NotificationType.ORDER_COMPLETED]: 'bg-green-50',
      [NotificationType.ORDER_PARTIAL_FILL]: 'bg-blue-50',
      [NotificationType.ORDER_CANCELLED]: 'bg-red-50',
    };
    return colorMap[type] || 'bg-gray-50';
  }

  /**
   * Formiraj vreme od sada
   */
  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Upravo sada';
    } else if (minutes < 60) {
      return `Pre ${minutes} ${minutes === 1 ? 'minuta' : 'minuta'}`;
    } else if (hours < 24) {
      return `Pre ${hours} ${hours === 1 ? 'sata' : 'sati'}`;
    } else if (days < 7) {
      return `Pre ${days} ${days === 1 ? 'dana' : 'dana'}`;
    } else {
      return new Date(timestamp).toLocaleDateString('sr-RS');
    }
  }

  /**
   * Zatvori panel
   */
  onClose(): void {
    this.close.emit();
  }
}
