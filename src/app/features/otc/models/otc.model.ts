export type OtcOfferStatus = 'PENDING_BUYER' | 'PENDING_SELLER' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
export type OtcPositionStatus = 'ACTIVE' | 'REMOVED';
export type OptionContractStatus = 'ACTIVE' | 'EXERCISED' | 'EXPIRED' | 'PENDING_PREMIUM' | 'CANCELED';

export interface OtcOffer {
  id: number;
  stockTicker: string;
  buyerId: number;
  sellerId: number;
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
  status: OtcOfferStatus;
  modifiedBy: string;
  lastModified: string;
  /**
   * PR_33 Phase B: opciona inter-bank polja.
   * Kad je `interbank=true`, ova ponuda dolazi iz Banka 2 (cross-bank pregovor)
   * i ne postoji u intra-bank `/otc/offers` listi.
   *
   * - `counterpartyBankCode` = routingNumber druge banke (npr. `222` za Banka 2).
   *   Naša banka = 111. Ako je `interbank=false` ili undefined, polje je 111.
   * - `counterpartyBankName` = display name druge banke (npr. "Banka 2").
   * - `localId` = naš mirror id u `interbank_negotiations` tabeli (npr. `neg-handshake-s9`).
   *   Kada je interbank=true, ovaj string se koristi umesto `id: number` za sve API pozive.
   * - `remoteId` = partner-ov id (kada je `is_authoritative=false`, mi smo non-owner pregovora).
   */
  interbank?: boolean;
  counterpartyBankCode?: number;
  counterpartyBankName?: string;
  localId?: string;
  remoteId?: string;
  /**
   * FIX 4: za inter-bank pregovore — pravo stanje iz backenda (`is_ongoing`).
   * `status` se za interbank mapira na 'ACCEPTED' kada je pregovor zatvoren, ali to
   * NE znaci nuzno da je prihvacen — moze biti i odbijen/zatvoren od partnera (protokol
   * nema reject poruku). `isOngoing=false` znaci samo da pregovor vise nije aktivan;
   * UI koristi ovo polje da odluci da li su Counter/Withdraw akcije i dalje moguce i da
   * prikaze "Zatvoreno" umesto laznog "Prihvaceno". Za intra-bank ostaje undefined.
   */
  isOngoing?: boolean;
  /**
   * PR_33 Phase B: valuta cene/premije (npr. "USD", "EUR").
   * Za inter-bank pregovore dolazi iz `state.pricePerUnit.currency` /
   * `state.premium.currency`; za intra-bank ostaje undefined (implicitno RSD/USD).
   */
  priceCurrency?: string;
  premiumCurrency?: string;
}

export interface CreateOtcOfferRequest {
  stockTicker: string;
  sellerId: number;
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
}

/** Raw API response shape from GET /otc/public-stocks — grouped by ticker. */
export interface OtcPublicStockGroup {
  ticker: string;
  sellers: {
    sellerId: number;
    sellerName: string;
    availableQuantity: number;
  }[];
}

/** Flat view-model used by the Available Stocks table (one row per seller entry). */
export interface OtcPublicStockEntry {
  ticker: string;
  sellerId: number;
  sellerName: string;
  availableQuantity: number;
}

/** A seller's OTC position — returned by GET /otc/my-positions. */
export interface OtcPosition {
  id: number;
  listingId: number;
  stockTicker: string;
  totalQuantity: number;
  reservedQuantity: number;
  publicQuantity: number;
  availableQuantity: number;
}

export interface CreateOtcPositionRequest {
  listingId: number;
  publicQuantity: number;
}

export interface UpdateOtcPositionRequest {
  publicQuantity: number;
}

export interface CounterOfferRequest {
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
}

export interface OtcHistoryParams {
  status?: OtcOfferStatus;
  otherPartyId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OtcOfferHistoryEvent {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  actorId: number;
  actorName: string | null;
  eventType: string;
  stockTicker: string;
  oldAmount: number | null;
  newAmount: number;
  oldPricePerStock: number | null;
  newPricePerStock: number;
  oldPremium: number | null;
  newPremium: number;
  oldSettlementDate: string | null;
  newSettlementDate: string;
  oldStatus: OtcOfferStatus | null;
  newStatus: OtcOfferStatus;
  changedAt: string;
}

/**
 * PR_14 C14.5: backend response za GET /otc/contracts/my (vidi
 * OptionContractDto.java). Premium NIJE deo ugovora — placen je u trenutku
 * accept-a kroz OtcPremiumTransferSaga; istorija premium-a je dostupna
 * samo kroz OtcOffer entitet.
 */
export interface OptionContract {
  id: number;
  offerId: number;
  stockTicker: string;
  buyerId: number;
  sellerId: number;
  amount: number;
  pricePerStock: number;
  settlementDate: string;
  status: OptionContractStatus;
  createdAt: string;
  exercisedAt?: string;
  /**
   * PR_33 Phase B: opciona inter-bank polja (identicna semantika kao OtcOffer).
   */
  interbank?: boolean;
  counterpartyBankCode?: number;
  counterpartyBankName?: string;
  localId?: string;
  remoteId?: string;
}

// -------------------------------------------------------------------------
// PR_33 Phase B: Inter-bank protokol DTO-i (cross-bank Banka 1 ↔ Banka 2).
// -------------------------------------------------------------------------

/**
 * Foreign bank id: par (routingNumber, id) per protokol spec §3.
 * Lokalni id format: "C-{n}" (klijent) ili "E-{n}" (employee).
 */
export interface ForeignBankId {
  routingNumber: number;
  id: string;
}

/** Monetary value sa eksplicitnom valutom (BigDecimal serijalizovan kao number). */
export interface MonetaryValue {
  currency: string;
  amount: number;
}

/** Stock referenca: ticker je dovoljan, asset.type='STOCK' implicitno. */
export interface StockRef {
  ticker: string;
}

/**
 * View model preslozen od backend `OutboundNegotiationResponse`
 * (vidi `Banka1-Inter-Bank-Implementacija-Sumarno.md` §3 i `interbank-service`
 * `OtcNegotiationController`). Konzumiran u OTC tabelama i prilikom mapiranja
 * cross-bank pregovora u `OtcOffer` format.
 */
export interface InterbankNegotiationView {
  localId: string;
  remoteId?: string | null;
  isAuthoritative: boolean;
  counterpartyBankCode: number;
  counterpartyBankName?: string;
  buyerId: ForeignBankId;
  sellerId: ForeignBankId;
  lastModifiedBy: ForeignBankId;
  stockTicker: string;
  priceCurrency: string;
  pricePerUnit: string;
  amount: number;
  settlementDate: string;
  premiumCurrency: string;
  premium: string;
  isOngoing: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

/**
 * Request za `POST /api/interbank/otc/negotiations` — initiator-side
 * outbound cross-bank pregovor (naša banka kao kupac, druga banka kao prodavac).
 */
export interface CreateInterbankNegotiationRequest {
  stockTicker: string;
  settlementDate: string;
  priceCurrency: string;
  pricePerUnit: number;
  premiumCurrency: string;
  premium: number;
  sellerForeignBankId: ForeignBankId;
  amount: number;
}

/**
 * Request za `PUT /api/interbank/otc/negotiations/{id}/counter` — counter-offer
 * na otvoreni cross-bank pregovor.
 */
export interface CounterInterbankNegotiationRequest {
  amount: number;
  priceCurrency: string;
  pricePerUnit: number;
  premiumCurrency: string;
  premium: number;
  settlementDate: string;
}

/** Status sklopljenog cross-bank opcionog ugovora (vidi GET /api/interbank/otc/contracts/my). */
export type OtcInterbankContractStatus = 'ACTIVE' | 'EXERCISED' | 'EXPIRED';

/**
 * Sklopljeni cross-bank OTC opcioni ugovor — response shape iz
 * `GET /api/interbank/otc/contracts/my` (backend `OtcInterbankContractDto`).
 *
 * <p>Za razliku od intra-bank {@link OptionContract}, ovde su `buyerId`/`sellerId`
 * parovi (routingNumber, id) per inter-bank protokol §3, a strike je `MonetaryValue`
 * razdvojen na `strikeCurrency` + `strikeAmount` (serijalizovan kao string da bi se
 * sacuvala BigDecimal preciznost).
 *
 * <p>`localId` je nas mirror id ugovora i koristi se za exercise poziv
 * (`POST /api/interbank/otc/contracts/{localId}/exercise`).
 */
export interface OtcInterbankContract {
  localId: string;
  negotiationId: string;
  buyerId: ForeignBankId;
  sellerId: ForeignBankId;
  ticker: string;
  amount: number;
  strikeCurrency: string;
  strikeAmount: string;
  settlementDate: string;
  status: OtcInterbankContractStatus;
  optionPseudoOwnerRouting: number;
  optionPseudoOwnerId: string;
  createdAt: string;
  exercisedAt?: string;
  expiredAt?: string;
}
