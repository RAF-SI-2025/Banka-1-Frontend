import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { NotificationService, UNREAD_POLL_INTERVAL_MS } from './notification.service';
import { Notification, NotificationPage } from '../models/notification.model';

const baseUrl = `${environment.apiUrl}/notifications`;
const countUrl = `${baseUrl}/unread-count`;

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

/**
 * The service constructor schedules `timer(0, ...)` for the unread-count poll.
 * To keep that timer inside the fakeAsync test zone (so `tick` controls it),
 * the service must be injected *inside* the test rather than in `beforeEach`.
 */
describe('NotificationService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    /* Every test flushes its own requests and destroys the service; this
       catches any leak (e.g. an un-ticked poll). */
    httpMock.verify();
  });

  function makeService(): NotificationService {
    return TestBed.inject(NotificationService);
  }

  describe('list', () => {
    it('GETs the paged feed with page/size params', fakeAsync(() => {
      const service = makeService();
      tick(0); // flush the constructor poll
      httpMock.expectOne(countUrl).flush({ count: 0 });

      let result: NotificationPage | undefined;
      service.list(2, 8).subscribe((p) => (result = p));

      const req = httpMock.expectOne(
        (r) => r.url === baseUrl && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('8');

      const body = page([notif(1), notif(2)], 12);
      req.flush(body);
      expect(result).toEqual(body);

      service.ngOnDestroy();
    }));

    it('defaults to page 0 size 10', fakeAsync(() => {
      const service = makeService();
      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 });

      service.list().subscribe();
      const req = httpMock.expectOne((r) => r.url === baseUrl);
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(page([]));

      service.ngOnDestroy();
    }));
  });

  describe('unreadCount', () => {
    it('GETs /unread-count and unwraps the count number', fakeAsync(() => {
      const service = makeService();
      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 }); // constructor poll

      let count: number | undefined;
      service.unreadCount().subscribe((c) => (count = c));

      const req = httpMock.expectOne(countUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 7 });
      expect(count).toBe(7);

      service.ngOnDestroy();
    }));

    it('treats a missing count as 0', fakeAsync(() => {
      const service = makeService();
      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 });

      let count: number | undefined;
      service.unreadCount().subscribe((c) => (count = c));
      httpMock.expectOne(countUrl).flush({});
      expect(count).toBe(0);

      service.ngOnDestroy();
    }));
  });

  describe('markRead', () => {
    it('PATCHes /{id}/read and refreshes the unread count', fakeAsync(() => {
      const service = makeService();
      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 }); // constructor poll

      service.markRead(42).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/42/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);

      /* mark-read triggers a follow-up unread-count refresh. */
      httpMock.expectOne(countUrl).flush({ count: 3 });

      service.ngOnDestroy();
    }));
  });

  describe('markAllRead', () => {
    it('PATCHes /read-all and refreshes the unread count', fakeAsync(() => {
      const service = makeService();
      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 }); // constructor poll

      service.markAllRead().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/read-all`);
      expect(req.request.method).toBe('PATCH');
      req.flush(null);

      httpMock.expectOne(countUrl).flush({ count: 0 });

      service.ngOnDestroy();
    }));
  });

  describe('unreadCount$ stream', () => {
    it('starts at 0 before the first poll resolves', fakeAsync(() => {
      const service = makeService();
      let emitted: number | undefined;
      service.unreadCount$.subscribe((c) => (emitted = c));
      expect(emitted).toBe(0);

      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 0 });
      service.ngOnDestroy();
    }));

    it('the immediate constructor poll pushes the server value', fakeAsync(() => {
      const service = makeService();
      const seen: number[] = [];
      service.unreadCount$.subscribe((c) => seen.push(c));

      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 5 });
      expect(seen[seen.length - 1]).toBe(5);

      service.ngOnDestroy();
    }));

    it('refreshUnreadCount() pushes the latest server value', fakeAsync(() => {
      const service = makeService();
      const seen: number[] = [];
      service.unreadCount$.subscribe((c) => seen.push(c));

      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 5 });
      expect(seen[seen.length - 1]).toBe(5);

      service.refreshUnreadCount();
      httpMock.expectOne(countUrl).flush({ count: 9 });
      expect(seen[seen.length - 1]).toBe(9);

      service.ngOnDestroy();
    }));

    it('polls the unread count on the interval', fakeAsync(() => {
      const service = makeService();
      const seen: number[] = [];
      service.unreadCount$.subscribe((c) => seen.push(c));

      tick(0); // immediate poll
      httpMock.expectOne(countUrl).flush({ count: 1 });

      tick(UNREAD_POLL_INTERVAL_MS);
      httpMock.expectOne(countUrl).flush({ count: 2 });
      expect(seen[seen.length - 1]).toBe(2);

      tick(UNREAD_POLL_INTERVAL_MS);
      httpMock.expectOne(countUrl).flush({ count: 4 });
      expect(seen[seen.length - 1]).toBe(4);

      service.ngOnDestroy();
    }));

    it('keeps the last good value when a poll fails', fakeAsync(() => {
      const service = makeService();
      const seen: number[] = [];
      service.unreadCount$.subscribe((c) => seen.push(c));

      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 6 });
      expect(seen[seen.length - 1]).toBe(6);

      tick(UNREAD_POLL_INTERVAL_MS);
      httpMock
        .expectOne(countUrl)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      /* failed poll must not crash the stream nor change the value */
      expect(seen[seen.length - 1]).toBe(6);

      tick(UNREAD_POLL_INTERVAL_MS);
      httpMock.expectOne(countUrl).flush({ count: 8 });
      expect(seen[seen.length - 1]).toBe(8);

      service.ngOnDestroy();
    }));

    it('stops polling after ngOnDestroy', fakeAsync(() => {
      const service = makeService();
      service.unreadCount$.subscribe();

      tick(0);
      httpMock.expectOne(countUrl).flush({ count: 1 });

      service.ngOnDestroy();
      tick(UNREAD_POLL_INTERVAL_MS * 2);
      /* no further poll requests after destroy */
      httpMock.expectNone(countUrl);
    }));
  });
});
