/**
 * OTC (Over-The-Counter) Offer Model
 * Predstavlja ponudu za negocijaciju između klijenta i aktuara
 */

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Bank {
  id: number;
  name: string;
  acronym: string;
}

export interface Counterparty {
  user: User;
  bank: Bank;
}

export interface OtcOffer {
  id: number;
  /** Hartija od vrednosti (npr. ticker) */
  ticker: string;
  listingId: number;
  /** Količina */
  quantity: number;
  /** Cena po akciji */
  pricePerShare: number;
  /** Premija (razlika od tržišne cene) */
  premium: number;
  /** Datum settlement-a */
  settlementDate: string;
  /** Korisnik koji je iniciator ponude */
  initiatedBy: User;
  /** Stranka sa kojom se pregovara */
  counterparty: Counterparty;
  /** Korisnik koji je zadnje modifikovao ponudu */
  modifiedBy: User;
  /** Timestamp poslednje izmene */
  lastModified: string;
  /** Status ponude: PENDING, ACCEPTED, REJECTED, COUNTER_OFFER */
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER';
  /** Trenutna tržišna cena */
  currentMarketPrice?: number;
  /** Da li je ponuda pročitana od strane logovanog korisnika */
  isRead?: boolean;
}

export interface CreateOtcOfferRequest {
  listingId: number;
  quantity: number;
  pricePerShare: number;
  premium: number;
  settlementDate: string;
  counterpartyId: number;
}

export interface CounterOfferRequest {
  otcOfferId: number;
  quantity: number;
  pricePerShare: number;
  premium: number;
  settlementDate: string;
}

export interface OptionalContractRequest {
  otcOfferId: number;
  /** Premium amount to be paid */
  premiumAmount: number;
}

export interface OtcOfferPage {
  content: OtcOffer[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
