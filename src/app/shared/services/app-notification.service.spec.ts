import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../core/services/auth.service';
import { AppNotificationService } from './app-notification.service';
import { ToastService } from './toast.service';

describe('AppNotificationService', () => {
  let service: AppNotificationService;
  let toast: jasmine.SpyObj<ToastService>;
  let auth: jasmine.SpyObj<AuthService>;

  const baseParams = {
    category: 'OTC' as const,
    kind: 'OTC_COUNTER_OFFER' as const,
    message: 'Druga strana je poslala kontraponudu za AAPL.',
    dedupeKey: 'offer:1:counter',
    showToast: false,
  };

  beforeEach(() => {
    toast = jasmine.createSpyObj('ToastService', ['info']);
    auth = jasmine.createSpyObj('AuthService', ['getUserIdFromToken']);
    auth.getUserIdFromToken.and.returnValue(77);

    TestBed.configureTestingModule({
      providers: [
        AppNotificationService,
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: auth },
      ],
    });

    service = TestBed.inject(AppNotificationService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('push() dodaje notifikaciju', () => {
    service.push(baseParams);

    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].message).toBe(baseParams.message);
    expect(service.snapshot[0].read).toBe(false);
    expect(service.unreadCount).toBe(1);
  });

  it('push() poziva toast.info kada je showToast uključen', () => {
    service.push({ ...baseParams, dedupeKey: 'toast-key', showToast: true });

    expect(toast.info).toHaveBeenCalledWith(baseParams.message);
  });

  it('ne dodaje duplikat sa istim dedupeKey u roku od 1h', () => {
    service.push(baseParams);
    service.push({ ...baseParams, message: 'Druga poruka' });

    expect(service.snapshot.length).toBe(1);
  });

  it('ograničava inbox na najviše 50 notifikacija', () => {
    for (let i = 0; i < 55; i++) {
      service.push({
        ...baseParams,
        dedupeKey: `offer:${i}:counter`,
        message: `Poruka ${i}`,
      });
    }

    expect(service.snapshot.length).toBe(50);
    expect(service.snapshot[0].message).toBe('Poruka 54');
    expect(service.snapshot[49].message).toBe('Poruka 5');
  });

  it('markRead() označava notifikaciju kao pročitanu', () => {
    service.push(baseParams);
    const id = service.snapshot[0].id;

    service.markRead(id);

    expect(service.snapshot[0].read).toBe(true);
    expect(service.unreadCount).toBe(0);
  });

  it('markAllRead() označava sve kao pročitane', () => {
    service.push({ ...baseParams, dedupeKey: 'k1' });
    service.push({ ...baseParams, dedupeKey: 'k2', message: 'Druga' });

    service.markAllRead();

    expect(service.snapshot.every((n) => n.read)).toBe(true);
    expect(service.unreadCount).toBe(0);
  });

  it('clear() briše sve notifikacije i localStorage', () => {
    service.push(baseParams);
    expect(localStorage.getItem('app-notifications:77')).toBeTruthy();

    service.clear();

    expect(service.snapshot).toEqual([]);
    expect(localStorage.getItem('app-notifications:77')).toBeNull();
  });

  it('notifications$ prestaje da emituje posle unsubscribe', () => {
    const emissions: number[] = [];
    const sub = service.notifications$.subscribe((list) => emissions.push(list.length));

    service.push(baseParams);
    service.push({ ...baseParams, dedupeKey: 'druga' });

    sub.unsubscribe();

    const countAfterUnsub = emissions.length;
    service.push({ ...baseParams, dedupeKey: 'treca' });

    expect(emissions.length).toBe(countAfterUnsub);
    expect(service.snapshot.length).toBe(3);
  });

  it('hydrateFromStorage() učitava sačuvane notifikacije', () => {
    const stored = [
      {
        id: 'stored-1',
        category: 'OTC',
        kind: 'OTC_CONTRACT_EXPIRING',
        message: 'Sačuvano',
        createdAt: new Date().toISOString(),
        read: false,
        dedupeKey: 'contract:1:expiry',
      },
    ];
    localStorage.setItem('app-notifications:77', JSON.stringify(stored));

    service.hydrateFromStorage();

    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].message).toBe('Sačuvano');
  });
});
