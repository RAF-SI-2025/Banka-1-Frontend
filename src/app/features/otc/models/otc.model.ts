export type OtcOfferStatus = 'PENDING_BUYER' | 'PENDING_SELLER' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type OptionContractStatus = 'ACTIVE' | 'EXERCISED' | 'EXPIRED';

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
}

export interface CreateOtcOfferRequest {
  stockTicker: string;
  sellerId: number;
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
}

export interface CounterOfferRequest {
  amount: number;
  pricePerStock: number;
  premium: number;
  settlementDate: string;
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
  remoteForeignBankId: ForeignBankId;
  state: {
    stock: StockRef;
    settlementDate: string;
    pricePerUnit: MonetaryValue;
    premium: MonetaryValue;
    buyerId: ForeignBankId;
    sellerId: ForeignBankId;
    amount: number;
    lastModifiedBy: ForeignBankId;
    isOngoing: boolean;
  };
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
