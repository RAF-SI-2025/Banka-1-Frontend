import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { NotificationsComponent } from './notifications.component';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../shared/services/toast.service';
import { Notification, NotificationPage } from '../../core/models/notification.model';

function notif(id: number, read = false): Notification {
  return {
    id,
    type: 'PAYMENT',
    title: `Naslov ${id}`,
    body: `Telo ${id}`,
    read,
    referenceId: null,
    createdAt: '2026-05-19T10:00:00Z',
  };
}

function page(content: Notification[], totalElements = content.length): NotificationPage {
  return {
    content,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / 10)),
    number: 0,
    size: 10,
  };
}

describe('NotificationsComponent', () => {
  let fixture: ComponentFixture<NotificationsComponent>;
  let component: NotificationsComponent;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    notificationService = jasmine.createSpyObj('NotificationService', [
      'list',
      'markRead',
      'markAllRead',
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
      providers: [
        { provide: NotificationService, useValue: notificationService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
  });

  it('loads the first page on init', () => {
    notificationService.list.and.returnValue(of(page([notif(1), notif(2, true)], 2)));
    fixture.detectChanges();

    expect(notificationService.list).toHaveBeenCalledWith(0, 10);
    expect(component.notifications.length).toBe(2);
    expect(component.totalElements).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('sets an error message when the feed fails to load', () => {
    notificationService.list.and.returnValue(
      throwError(() => new Error('network')),
    );
    fixture.detectChanges();

    expect(component.error).toBe('Greska pri ucitavanju notifikacija.');
    expect(component.isLoading).toBeFalse();
  });

  it('counts unread notifications on the current page', () => {
    notificationService.list.and.returnValue(
      of(page([notif(1), notif(2, true), notif(3)], 3)),
    );
    fixture.detectChanges();
    expect(component.unreadOnPage).toBe(2);
  });

  it('onPageChange reloads with the new 0-indexed page', () => {
    notificationService.list.and.returnValue(of(page([], 50)));
    fixture.detectChanges();

    component.onPageChange(3);
    expect(component.currentPage).toBe(3);
    expect(notificationService.list).toHaveBeenCalledWith(3, 10);
  });

  it('markRead flips the row to read on success', () => {
    notificationService.list.and.returnValue(of(page([notif(1)], 1)));
    notificationService.markRead.and.returnValue(of(void 0));
    fixture.detectChanges();

    const n = component.notifications[0];
    component.markRead(n);
    expect(notificationService.markRead).toHaveBeenCalledWith(1);
    expect(n.read).toBeTrue();
  });

  it('markRead is a no-op for an already-read notification', () => {
    notificationService.list.and.returnValue(of(page([notif(1, true)], 1)));
    fixture.detectChanges();

    component.markRead(component.notifications[0]);
    expect(notificationService.markRead).not.toHaveBeenCalled();
  });

  it('markRead surfaces an error toast on failure', () => {
    notificationService.list.and.returnValue(of(page([notif(1)], 1)));
    notificationService.markRead.and.returnValue(
      throwError(() => new Error('boom')),
    );
    fixture.detectChanges();

    component.markRead(component.notifications[0]);
    expect(toast.error).toHaveBeenCalled();
  });

  it('markAllRead reloads and toasts success', () => {
    notificationService.list.and.returnValue(of(page([notif(1)], 1)));
    notificationService.markAllRead.and.returnValue(of(void 0));
    fixture.detectChanges();
    notificationService.list.calls.reset();

    component.markAllRead();
    expect(notificationService.markAllRead).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(notificationService.list).toHaveBeenCalled();
    expect(component.markingAll).toBeFalse();
  });

  it('markAllRead is a no-op when nothing is unread', () => {
    notificationService.list.and.returnValue(of(page([notif(1, true)], 1)));
    fixture.detectChanges();

    component.markAllRead();
    expect(notificationService.markAllRead).not.toHaveBeenCalled();
  });
});
