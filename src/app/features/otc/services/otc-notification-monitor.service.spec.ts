import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AppNotificationService } from '../../../shared/services/app-notification.service';
import { OtcOffer } from '../models/otc.model';
import { OtcService } from './otc.service';
import {
  OtcNotificationMonitorService,
  OTC_NOTIFICATION_POLL_MS_DEFAULT,
  resolveOtcNotificationPollMs,
} from './otc-notification-monitor.service';

const SAMPLE_OFFER: OtcOffer = {
  id: 1,
  stockTicker: 'AAPL',
  buyerId: 77,
  sellerId: 88,
  amount: 10,
  pricePerStock: 150,
  premium: 50,
  settlementDate: '2027-12-31',
  status: 'PENDING_SELLER',
  modifiedBy: '77',
  lastModified: '',
};

describe('resolveOtcNotificationPollMs', () => {
  const originalOverride = window.__OTC_POLL_MS;

  afterEach(() => {
    if (originalOverride == null) {
      delete window.__OTC_POLL_MS;
    } else {
      window.__OTC_POLL_MS = originalOverride;
    }
  });

  it('returns default 30s when no override', () => {
    delete window.__OTC_POLL_MS;
    expect(resolveOtcNotificationPollMs()).toBe(OTC_NOTIFICATION_POLL_MS_DEFAULT);
  });

  it('enforces minimum 5s even in production builds (blocks aggressive 500ms)', () => {
    window.__OTC_POLL_MS = 500;
    expect(resolveOtcNotificationPollMs()).toBe(5000);
  });

  it('allows override at or above 5s', () => {
    window.__OTC_POLL_MS = 8000;
    expect(resolveOtcNotificationPollMs()).toBe(8000);
  });

  it('allows override at exactly 5s', () => {
    window.__OTC_POLL_MS = 5000;
    expect(resolveOtcNotificationPollMs()).toBe(5000);
  });
});

describe('OtcNotificationMonitorService — network resilience', () => {
  let service: OtcNotificationMonitorService;
  let otcService: jasmine.SpyObj<OtcService>;
  let notifications: jasmine.SpyObj<AppNotificationService>;

  beforeEach(() => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'getLoggedUser',
      'getUserIdFromToken',
    ]);
    auth.getToken.and.returnValue('token');
    auth.getLoggedUser.and.returnValue({
      email: 'otc@test.com',
      permissions: ['CLIENT_TRADING'],
    });
    auth.getUserIdFromToken.and.returnValue(77);

    otcService = jasmine.createSpyObj<OtcService>('OtcService', [
      'getActiveOffers',
      'myContracts',
    ]);
    otcService.myContracts.and.returnValue(of([]));

    notifications = jasmine.createSpyObj<AppNotificationService>(
      'AppNotificationService',
      ['push'],
    );

    TestBed.configureTestingModule({
      providers: [
        OtcNotificationMonitorService,
        { provide: OtcService, useValue: otcService },
        { provide: AuthService, useValue: auth },
        { provide: AppNotificationService, useValue: notifications },
      ],
    });

    service = TestBed.inject(OtcNotificationMonitorService);
    window.__OTC_POLL_MS = 100;
  });

  afterEach(fakeAsync(() => {
    service.stop();
    delete window.__OTC_POLL_MS;
    discardPeriodicTasks();
  }));

  it('ne gasi polling posle greške u getActiveOffers (retry pa sledeći ciklus)', fakeAsync(() => {
    let calls = 0;
    otcService.getActiveOffers.and.callFake(() => {
      calls += 1;
      if (calls === 1) {
        return throwError(() => new Error('negotiations network error'));
      }
      return of([SAMPLE_OFFER]);
    });

    service.start();
    tick(0);
    tick(2000);
    tick(4000);
    tick(8000);

    expect(calls).toBeGreaterThan(1);
    expect(service['pollSub']).toBeTruthy();

    service.stop();
    discardPeriodicTasks();
  }));

  it('nastavlja poll sa praznom listom ponuda (simulacija negotiations fallback)', fakeAsync(() => {
    otcService.getActiveOffers.and.returnValue(of([]));

    service.start();
    tick(0);
    tick(100);

    expect(otcService.getActiveOffers).toHaveBeenCalled();
    expect(service['pollSub']).toBeTruthy();
    expect(notifications.push).not.toHaveBeenCalled();

    service.stop();
    discardPeriodicTasks();
  }));
});
