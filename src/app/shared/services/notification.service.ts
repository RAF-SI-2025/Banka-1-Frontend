import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  AddNotificationDto,
  NotificationResponse
} from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private readonly MAX_NOTIFICATIONS = 100;

  notifications$ = this.notificationsSubject.asObservable();

  /**
   * Observable sa brojem nepročitanih notifikacija
   */
  unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => n.status === NotificationStatus.UNREAD).length)
  );

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Dodaj novu notifikaciju
   */
  addNotification(dto: AddNotificationDto): void {
    const notification: Notification = {
      id: this.generateId(),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      status: NotificationStatus.UNREAD,
      timestamp: new Date(),
      data: dto.data,
      actionUrl: dto.actionUrl,
    };

    const notifications = [notification, ...this.notificationsSubject.value];
    const trimmedNotifications = notifications.slice(0, this.MAX_NOTIFICATIONS);

    this.notificationsSubject.next(trimmedNotifications);
    this.saveToLocalStorage();
  }

  /**
   * Označi notifikaciju kao pročitanu
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, status: NotificationStatus.READ } : n
    );
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage();
  }

  /**
   * Označi sve notifikacije kao pročitane
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.status === NotificationStatus.UNREAD ? { ...n, status: NotificationStatus.READ } : n
    );
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage();
  }

  /**
   * Obriši notifikaciju
   */
  deleteNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage();
  }

  /**
   * Obriši sve notifikacije
   */
  deleteAll(): void {
    this.notificationsSubject.next([]);
    this.saveToLocalStorage();
  }

  /**
   * Arhiviraj notifikaciju
   */
  archiveNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, status: NotificationStatus.ARCHIVED } : n
    );
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage();
  }

  /**
   * Dobij sve aktivne notifikacije (nisu arhivirane)
   */
  getActiveNotifications(): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => 
        notifications.filter(n => n.status !== NotificationStatus.ARCHIVED)
      )
    );
  }

  /**
   * Dobij broj nepročitanih notifikacija
   */
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(
      n => n.status === NotificationStatus.UNREAD
    ).length;
  }

  /**
   * Dobij sve notifikacije
   */
  getAll(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Pronađi notifikaciju po ID-u
   */
  getById(id: string): Notification | undefined {
    return this.notificationsSubject.value.find(n => n.id === id);
  }

  /**
   * Pronađi notifikacije po tipu
   */
  getByType(type: NotificationType): Notification[] {
    return this.notificationsSubject.value.filter(n => n.type === type);
  }

  /**
   * Pronađi notifikacije po statusu
   */
  getByStatus(status: NotificationStatus): Notification[] {
    return this.notificationsSubject.value.filter(n => n.status === status);
  }

  /**
   * Obriši sve notifikacije određenog tipa
   */
  deleteByType(type: NotificationType): void {
    const notifications = this.notificationsSubject.value.filter(n => n.type !== type);
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage();
  }

  /**
   * Generiši jedinstveni ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sačuvaj notifikacije u localStorage
   */
  private saveToLocalStorage(): void {
    const notifications = this.notificationsSubject.value;
    const serialized = JSON.stringify(
      notifications.map(n => ({
        ...n,
        timestamp: n.timestamp.toString(),
      }))
    );
    localStorage.setItem('notifications', serialized);
  }

  /**
   * Učitaj notifikacije iz localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        this.notificationsSubject.next(notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }
}
