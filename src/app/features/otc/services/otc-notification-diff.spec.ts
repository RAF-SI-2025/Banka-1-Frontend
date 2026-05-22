import { OptionContract, OtcOffer } from '../models/otc.model';
import {
  detectContractExpiryNotifications,
  detectOfferNotifications,
  daysUntilSettlement,
  toOfferSnapshot,
} from './otc-notification-diff';

function offer(
  partial: Partial<OtcOffer> & Pick<OtcOffer, 'id' | 'stockTicker' | 'buyerId' | 'sellerId'>,
): OtcOffer {
  return {
    amount: 10,
    pricePerStock: 100,
    premium: 50,
    settlementDate: '2027-06-01',
    status: 'PENDING_BUYER',
    modifiedBy: '2',
    lastModified: '',
    ...partial,
  };
}

function contract(
  partial: Partial<OptionContract> &
    Pick<OptionContract, 'id' | 'stockTicker' | 'buyerId' | 'sellerId'>,
): OptionContract {
  return {
    offerId: 1,
    amount: 10,
    pricePerStock: 100,
    settlementDate: '2027-06-01',
    status: 'ACTIVE',
    createdAt: '',
    ...partial,
  };
}

describe('otc-notification-diff', () => {
  describe('detectOfferNotifications', () => {
    it('detects counter-offer when terms change and it is user turn', () => {
      const before = toOfferSnapshot(
        offer({ id: 1, stockTicker: 'AAPL', buyerId: 1, sellerId: 2, pricePerStock: 100 }),
      );
      const prev = new Map([[before.key, before]]);
      const current = [
        offer({
          id: 1,
          stockTicker: 'AAPL',
          buyerId: 1,
          sellerId: 2,
          status: 'PENDING_BUYER',
          pricePerStock: 110,
        }),
      ];

      const events = detectOfferNotifications(prev, current, 1, false);
      expect(events.some((e) => e.kind === 'OTC_COUNTER_OFFER')).toBe(true);
    });

    it('detects offer accepted', () => {
      const before = toOfferSnapshot(
        offer({ id: 2, stockTicker: 'MSFT', buyerId: 1, sellerId: 3, status: 'PENDING_BUYER' }),
      );
      const prev = new Map([[before.key, before]]);
      const current = [
        offer({ id: 2, stockTicker: 'MSFT', buyerId: 1, sellerId: 3, status: 'ACCEPTED' }),
      ];

      const events = detectOfferNotifications(prev, current, 1, false);
      expect(events.some((e) => e.kind === 'OTC_OFFER_ACCEPTED')).toBe(true);
    });

    it('detects offer rejected', () => {
      const before = toOfferSnapshot(
        offer({ id: 3, stockTicker: 'GOOG', buyerId: 1, sellerId: 4, status: 'PENDING_SELLER' }),
      );
      const prev = new Map([[before.key, before]]);
      const current = [
        offer({ id: 3, stockTicker: 'GOOG', buyerId: 1, sellerId: 4, status: 'REJECTED' }),
      ];

      const events = detectOfferNotifications(prev, current, 1, false);
      expect(events.some((e) => e.kind === 'OTC_OFFER_REJECTED')).toBe(true);
    });

    it('detects withdrawn offer removed from active list', () => {
      const before = toOfferSnapshot(
        offer({ id: 5, stockTicker: 'MSFT', buyerId: 1, sellerId: 3, status: 'PENDING_SELLER' }),
      );
      const prev = new Map([[before.key, before]]);
      const events = detectOfferNotifications(prev, [], 1, false);
      expect(events.some((e) => e.kind === 'OTC_OFFER_WITHDRAWN')).toBe(true);
    });

    it('does not emit on initial poll', () => {
      const current = [offer({ id: 1, stockTicker: 'AAPL', buyerId: 1, sellerId: 2 })];
      const events = detectOfferNotifications(new Map(), current, 1, true);
      expect(events.length).toBe(0);
    });

    it('handles null prev and null current', () => {
      expect(detectOfferNotifications(null, null, 1, false)).toEqual([]);
    });

    it('handles empty prev map and empty current array', () => {
      expect(detectOfferNotifications(new Map(), [], 1, false)).toEqual([]);
    });

    it('returns empty when userId is null', () => {
      const current = [offer({ id: 1, stockTicker: 'AAPL', buyerId: 1, sellerId: 2 })];
      expect(detectOfferNotifications(new Map(), current, null, false)).toEqual([]);
    });

    it('skips invalid offer entries without throwing', () => {
      const before = toOfferSnapshot(
        offer({ id: 1, stockTicker: 'AAPL', buyerId: 1, sellerId: 2, status: 'PENDING_SELLER' }),
      );
      const prev = new Map([[before.key, before]]);
      const current = [
        null,
        undefined,
        offer({
          id: 1,
          stockTicker: 'AAPL',
          buyerId: 1,
          sellerId: 2,
          status: 'PENDING_BUYER',
          pricePerStock: 110,
        }),
        { id: 2, stockTicker: 'X', buyerId: 1, sellerId: 2 } as OtcOffer,
      ] as unknown as OtcOffer[];

      const events = detectOfferNotifications(prev, current, 1, false);
      expect(events.some((e) => e.kind === 'OTC_COUNTER_OFFER')).toBe(true);
      expect(events.length).toBe(1);
    });

    it('handles large arrays efficiently (10000 offers)', () => {
      const prev = new Map<string, ReturnType<typeof toOfferSnapshot>>();
      const current: OtcOffer[] = [];
      for (let i = 0; i < 10_000; i++) {
        const o = offer({ id: i, stockTicker: 'TCK', buyerId: 1, sellerId: 2 });
        const snap = toOfferSnapshot(o);
        prev.set(snap.key, snap);
        current.push(o);
      }

      const start = performance.now();
      detectOfferNotifications(prev, current, 1, false);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('detectContractExpiryNotifications', () => {
    it('detects contract expiring within warning window', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);
      const iso = soon.toISOString().substring(0, 10);

      const events = detectContractExpiryNotifications(
        [contract({ id: 9, stockTicker: 'AAPL', buyerId: 1, sellerId: 2, settlementDate: iso })],
        1,
      );

      expect(events.length).toBe(1);
      expect(events[0].kind).toBe('OTC_CONTRACT_EXPIRING');
    });

    it('handles settlement today as 0 days (no notification — ističe danas)', () => {
      const today = new Date().toISOString().split('T')[0];

      expect(daysUntilSettlement(today)).toBe(0);

      const events = detectContractExpiryNotifications(
        [contract({ id: 10, stockTicker: 'AAPL', buyerId: 1, sellerId: 2, settlementDate: today })],
        1,
      );

      expect(events.length).toBe(0);
    });

    it('notifies for settlement tomorrow (1 day left)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const iso = tomorrow.toISOString().substring(0, 10);

      const events = detectContractExpiryNotifications(
        [contract({ id: 11, stockTicker: 'AAPL', buyerId: 1, sellerId: 2, settlementDate: iso })],
        1,
      );

      expect(events.length).toBe(1);
      expect(events[0].message).toContain('1 dan');
    });

    it('returns empty when contracts list is null', () => {
      expect(detectContractExpiryNotifications(null, 1)).toEqual([]);
    });

    it('returns empty for empty contracts array', () => {
      expect(detectContractExpiryNotifications([], 1)).toEqual([]);
    });

    it('skips contracts where user is not participant', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 2);
      const iso = soon.toISOString().substring(0, 10);

      const events = detectContractExpiryNotifications(
        [contract({ id: 12, stockTicker: 'AAPL', buyerId: 99, sellerId: 88, settlementDate: iso })],
        1,
      );

      expect(events.length).toBe(0);
    });
  });

  describe('daysUntilSettlement', () => {
    it('returns positive days for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      const days = daysUntilSettlement(future.toISOString().substring(0, 10));
      expect(days).toBe(5);
    });

    it('returns null for invalid or missing date', () => {
      expect(daysUntilSettlement(undefined)).toBeNull();
      expect(daysUntilSettlement('')).toBeNull();
      expect(daysUntilSettlement('not-a-date')).toBeNull();
    });

    it('returns 0 for past settlement (not negative)', () => {
      expect(daysUntilSettlement('2000-01-01')).toBe(0);
    });
  });
});
