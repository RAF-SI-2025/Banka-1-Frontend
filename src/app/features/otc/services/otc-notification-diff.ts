import { OptionContract, OtcOffer } from '../models/otc.model';

/**
 * OTC in-app notification diff utilities (F11).
 * Compares successive poll snapshots and emits dedupe-ready notification events.
 */

/** Days before settlement when users are warned (spec: npr. 3 dana). */
export const OTC_EXPIRY_WARNING_DAYS = 3;

/** Kind of OTC event surfaced in the notification inbox / toast. */
export type OtcNotificationKind =
  | 'OTC_COUNTER_OFFER'
  | 'OTC_OFFER_ACCEPTED'
  | 'OTC_OFFER_REJECTED'
  | 'OTC_OFFER_WITHDRAWN'
  | 'OTC_CONTRACT_EXPIRING';

/** A single notification produced by diffing offers or contracts. */
export interface DetectedOtcNotification {
  kind: OtcNotificationKind;
  dedupeKey: string;
  message: string;
  route?: string;
}

/** Normalized offer fields used for O(n) Map-based comparison between polls. */
export interface OfferSnapshot {
  key: string;
  stockTicker: string;
  status: string;
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
  modifiedBy: string;
  buyerId: number;
  sellerId: number;
}

/**
 * Type guard: offer has the minimum fields required for diffing and notifications.
 *
 * @param o - Offer candidate (may be null/undefined)
 * @returns `true` when the offer can be compared safely
 */
export function isValidOffer(o: OtcOffer | null | undefined): o is OtcOffer {
  return (
    o != null &&
    o.id != null &&
    !!o.status &&
    !!o.stockTicker &&
    o.buyerId != null &&
    o.sellerId != null
  );
}

/**
 * Type guard: contract has the minimum fields required for expiry warnings.
 *
 * @param c - Contract candidate (may be null/undefined)
 * @returns `true` when the contract can be evaluated for expiry
 */
export function isValidContract(c: OptionContract | null | undefined): c is OptionContract {
  return (
    c != null &&
    c.id != null &&
    !!c.stockTicker &&
    !!c.status &&
    c.buyerId != null &&
    c.sellerId != null
  );
}

/**
 * Stable key for an offer across polls (local id vs inter-bank localId).
 *
 * @param o - Valid OTC offer
 * @returns `local:{id}` or `ib:{localId}` for inter-bank rows
 */
export function offerSnapshotKey(o: OtcOffer): string {
  return o.interbank && o.localId ? `ib:${o.localId}` : `local:${o.id}`;
}

/**
 * Builds a compact snapshot for Map-based diffing.
 *
 * @param o - Valid OTC offer
 * @returns Snapshot keyed by {@link offerSnapshotKey}
 */
export function toOfferSnapshot(o: OtcOffer): OfferSnapshot {
  return {
    key: offerSnapshotKey(o),
    stockTicker: o.stockTicker,
    status: o.status,
    amount: o.amount,
    pricePerStock: o.pricePerStock,
    premium: o.premium,
    settlementDate: o.settlementDate,
    modifiedBy: o.modifiedBy,
    buyerId: o.buyerId,
    sellerId: o.sellerId,
  };
}

/**
 * Whether the given user must act on a pending offer (buyer or seller turn).
 *
 * @param o - Offer snapshot
 * @param userId - Logged-in user id, or null when unknown
 */
export function isUsersTurn(o: OfferSnapshot, userId: number | null): boolean {
  if (userId == null) return false;
  if (o.status === 'PENDING_SELLER') return userId === o.sellerId;
  if (o.status === 'PENDING_BUYER') return userId === o.buyerId;
  return false;
}

/**
 * Whether the user is buyer or seller on the offer.
 *
 * @param o - Offer snapshot
 * @param userId - Logged-in user id, or null when unknown
 */
export function isParticipant(o: OfferSnapshot, userId: number | null): boolean {
  if (userId == null) return false;
  return userId === o.buyerId || userId === o.sellerId;
}

function termsChanged(a: OfferSnapshot, b: OfferSnapshot): boolean {
  return (
    a.amount !== b.amount ||
    a.pricePerStock !== b.pricePerStock ||
    a.premium !== b.premium ||
    a.settlementDate !== b.settlementDate ||
    a.modifiedBy !== b.modifiedBy
  );
}

const PENDING_STATUSES = new Set(['PENDING_BUYER', 'PENDING_SELLER']);

/**
 * Detects offer-related notifications by comparing the previous poll snapshot to the current list.
 * Uses Map-based diffing keyed by {@link offerSnapshotKey} for O(n) performance.
 *
 * Emits events when the current user is a participant and:
 * - **Counter-offer** — pending offer becomes their turn, or terms change while it is their turn
 * - **Accepted / rejected** — terminal status transition
 * - **Withdrawn** — offer disappeared from the active list while still pending
 *
 * @param prev - Previous offer snapshots by key (may be null/empty)
 * @param current - Current active offers from the latest poll (may be null)
 * @param userId - Logged-in user id; no events when null
 * @param isInitial - When true (first poll after start), skips all events to avoid noise
 * @returns Dedupe-ready notification descriptors (empty when inputs are invalid or initial poll)
 *
 * @throws None — returns an empty array on invalid or missing input
 *
 * @example
 * const prev = new Map([[key, toOfferSnapshot(oldOffer)]]);
 * const events = detectOfferNotifications(prev, currentOffers, userId, false);
 * events
 *   .filter((e) => e.kind === 'OTC_COUNTER_OFFER')
 *   .forEach((e) => console.log(e.message));
 */
export function detectOfferNotifications(
  prev: Map<string, OfferSnapshot> | null | undefined,
  current: OtcOffer[] | null | undefined,
  userId: number | null,
  isInitial: boolean,
): DetectedOtcNotification[] {
  if (isInitial || userId == null) return [];

  const safePrev = prev ?? new Map<string, OfferSnapshot>();
  const safeCurrent = (current ?? []).filter(isValidOffer);
  if (!safePrev.size && !safeCurrent.length) return [];

  const out: DetectedOtcNotification[] = [];
  const currentMap = new Map(
    safeCurrent.map((o) => {
      const snap = toOfferSnapshot(o);
      return [snap.key, snap] as const;
    }),
  );

  for (const [key, snap] of currentMap) {
    const before = safePrev.get(key);
    if (!before) continue;

    if (snap.status === 'ACCEPTED' && before.status !== 'ACCEPTED' && isParticipant(snap, userId)) {
      out.push({
        kind: 'OTC_OFFER_ACCEPTED',
        dedupeKey: `offer:${key}:accepted`,
        message: `Ponuda za ${snap.stockTicker} je prihvaćena.`,
        route: '/otc',
      });
      continue;
    }

    if (snap.status === 'REJECTED' && before.status !== 'REJECTED' && isParticipant(snap, userId)) {
      out.push({
        kind: 'OTC_OFFER_REJECTED',
        dedupeKey: `offer:${key}:rejected`,
        message: `Ponuda za ${snap.stockTicker} je odbijena.`,
        route: '/otc',
      });
      continue;
    }

    if (
      PENDING_STATUSES.has(snap.status) &&
      isUsersTurn(snap, userId) &&
      (!isUsersTurn(before, userId) || termsChanged(before, snap))
    ) {
      out.push({
        kind: 'OTC_COUNTER_OFFER',
        dedupeKey: `offer:${key}:counter:${snap.modifiedBy}:${snap.amount}:${snap.pricePerStock}`,
        message: `Druga strana je poslala kontraponudu za ${snap.stockTicker}.`,
        route: '/otc',
      });
    }
  }

  for (const [key, before] of safePrev) {
    if (currentMap.has(key)) continue;
    if (!PENDING_STATUSES.has(before.status) || !isParticipant(before, userId)) continue;
    out.push({
      kind: 'OTC_OFFER_WITHDRAWN',
      dedupeKey: `offer:${key}:withdrawn`,
      message: `Druga strana je odustala od ponude za ${before.stockTicker}.`,
      route: '/otc',
    });
  }

  return out;
}

/**
 * Number of calendar days until settlement (≥ 0).
 *
 * @param settlementDate - ISO date or `YYYY-MM-DD` string (may include time)
 * @returns Whole days until settlement, or `null` when the date is missing or invalid
 *
 * @throws None — returns `null` on parse errors
 *
 * @example
 * daysUntilSettlement('2026-12-01'); // e.g. 225
 * daysUntilSettlement('invalid');    // null
 */
export function daysUntilSettlement(settlementDate: string | null | undefined): number | null {
  try {
    if (!settlementDate) return null;

    const raw = settlementDate.includes('T')
      ? settlementDate.substring(0, 10)
      : settlementDate;
    if (!raw) return null;

    const settlement = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(settlement.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Math.ceil(
      (settlement.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(days, 0);
  } catch {
    return null;
  }
}

/**
 * Detects active contracts approaching settlement for the current user.
 *
 * @param contracts - Active contracts from poll (may be null)
 * @param userId - Logged-in user id; no events when null
 * @param warningDays - Notify when settlement is within this many days (default: {@link OTC_EXPIRY_WARNING_DAYS})
 * @returns Expiry warnings for contracts where `0 < daysUntilSettlement ≤ warningDays`
 *
 * @throws None — returns an empty array on invalid input
 *
 * @example
 * const warnings = detectContractExpiryNotifications(contracts, userId);
 * warnings.forEach((w) => console.log(w.message));
 */
export function detectContractExpiryNotifications(
  contracts: OptionContract[] | null | undefined,
  userId: number | null,
  warningDays: number = OTC_EXPIRY_WARNING_DAYS,
): DetectedOtcNotification[] {
  if (userId == null || !contracts?.length) return [];

  const out: DetectedOtcNotification[] = [];
  for (const c of contracts) {
    if (!isValidContract(c) || c.status !== 'ACTIVE') continue;
    if (c.buyerId !== userId && c.sellerId !== userId) continue;

    const days = daysUntilSettlement(c.settlementDate);
    if (days == null || days <= 0 || days > warningDays) continue;

    const dateLabel = c.settlementDate?.includes('T')
      ? c.settlementDate.substring(0, 10)
      : c.settlementDate;

    out.push({
      kind: 'OTC_CONTRACT_EXPIRING',
      dedupeKey: `contract:${c.id}:expiry:${dateLabel}`,
      message: `Opcioni ugovor za ${c.stockTicker} ističe za ${days} ${
        days === 1 ? 'dan' : 'dana'
      } (settlement: ${dateLabel}).`,
      route: '/otc',
    });
  }
  return out;
}
