/**
 * OTC (Over The Counter) Ugovori - Opcijski Ugovori
 * Tip ugovora za kupovinu/prodaju hartija od vrednosti
 */

export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'EXECUTED' | 'CANCELLED';

export interface StockInfo {
  symbol: string;        // npr. AAPL
  name: string;          // npr. Apple Inc.
  currentPrice: number;  // trenutna vrednost
  currency: string;      // npr. USD
}

export interface SellerInfo {
  id: string;
  name: string;
  bankName: string;
  bankCode: string;
}

export interface OtcContract {
  id: string;
  contractNumber: string;
  stock: StockInfo;
  amount: number;              // Količina akcija
  strikePrice: number;         // Dogovorena cena po akciji
  premium: number;             // Plaćeni iznos za opcioni ugovor
  settlementDate: Date;        // Datum poravnanja (rok do kog ugovor važi)
  seller: SellerInfo;
  profit: number;              // Obračunati profit
  status: ContractStatus;
  createdDate: Date;
  executionDate?: Date;        // Datum realizacije (ako je izvršen)
  totalValue?: number;         // strike price * amount
}

export interface OtcContractResponse {
  id: string;
  contractNumber: string;
  stock: StockInfo;
  amount: number;
  strikePrice: number;
  premium: number;
  settlementDate: string;      // Backend vraća kao string
  seller: SellerInfo;
  profit: number;
  status: ContractStatus;
  createdDate: string;
  executionDate?: string;
  totalValue?: number;
}

/**
 * SAGA Pattern - Faza transakcije
 * Prati status svake faze i razlog neuspeha ako postoji
 */
export type SagaPhaseName = 'reserving-funds' | 'checking-securities' | 'transferring-funds' | 'transferring-ownership';

export interface SagaPhaseResult {
  phase: SagaPhaseName;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

/**
 * Kompletna SAGA transakcija sa svim fazama i rezima
 */
export interface SagaTransaction {
  contractId: string;
  contractNumber: string;
  startTime: Date;
  endTime?: Date;
  phases: SagaPhaseResult[];
  finalStatus: 'pending' | 'success' | 'failed' | 'rolled-back';
  rollbackReason?: string;
}

/**
 * Simulacija rezervacije sredstava/hartija na frontend-u
 */
export interface ContractReservation {
  contractId: string;
  sellerId: string;
  amount: number;
  totalFundsNeeded: number;
  securitiesReserved: boolean;
  fundsReserved: boolean;
  reservationTime: Date;
}
