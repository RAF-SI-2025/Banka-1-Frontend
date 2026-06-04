import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import {
  AppNotification,
  AppNotificationCategory,
  AppNotificationKind,
} from '../models/app-notification.model';
import { ToastService } from './toast.service';

const MAX_NOTIFICATIONS = 50;
const DEDUPE_WINDOW_MS = 60 * 60 * 1000;
const STORAGE_KEY_PREFIX = 'app-notifications';

@Injectable({ providedIn: 'root' })
export class AppNotificationService {
  private readonly itemsSubject = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this.itemsSubject.asObservable();

  constructor(
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  get snapshot(): AppNotification[] {
    return this.itemsSubject.value;
  }

  get unreadCount(): number {
    return this.snapshot.filter((n) => !n.read).length;
  }

  /** Učitava inbox iz localStorage (po user id) nakon logina. */
  hydrateFromStorage(): void {
    if (this.snapshot.length > 0) return;
    const stored = this.loadFromStorage();
    if (stored.length > 0) {
      this.itemsSubject.next(stored);
    }
  }

  push(params: {
    category: AppNotificationCategory;
    kind: AppNotificationKind;
    message: string;
    dedupeKey: string;
    route?: string;
    showToast?: boolean;
  }): void {
    this.hydrateFromStorage();

    const now = Date.now();
    const existing = this.snapshot.find(
      (n) =>
        n.dedupeKey === params.dedupeKey &&
        now - new Date(n.createdAt).getTime() < DEDUPE_WINDOW_MS,
    );
    if (existing) return;

    const notification: AppNotification = {
      id: `${params.kind}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      category: params.category,
      kind: params.kind,
      message: params.message,
      createdAt: new Date().toISOString(),
      read: false,
      route: params.route,
      dedupeKey: params.dedupeKey,
    };

    const next = [notification, ...this.snapshot].slice(0, MAX_NOTIFICATIONS);
    this.itemsSubject.next(next);
    this.persist(next);

    if (params.showToast !== false) {
      this.toast.info(params.message);
    }
  }

  markRead(id: string): void {
    const next = this.snapshot.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.itemsSubject.next(next);
    this.persist(next);
  }

  markAllRead(): void {
    const next = this.snapshot.map((n) => ({ ...n, read: true }));
    this.itemsSubject.next(next);
    this.persist(next);
  }

  clear(): void {
    this.itemsSubject.next([]);
    const key = this.storageKey();
    if (key) {
      localStorage.removeItem(key);
    }
  }

  private storageKey(): string | null {
    const userId = this.auth.getUserIdFromToken();
    return userId != null ? `${STORAGE_KEY_PREFIX}:${userId}` : null;
  }

  private loadFromStorage(): AppNotification[] {
    const key = this.storageKey();
    if (!key) return [];

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return (parsed as AppNotification[]).slice(0, MAX_NOTIFICATIONS);
    } catch {
      return [];
    }
  }

  private persist(items: AppNotification[]): void {
    const key = this.storageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
    } catch {
      // Quota exceeded ili privatni režim — inbox ostaje samo u memoriji.
    }
  }
}
