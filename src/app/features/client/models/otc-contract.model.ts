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
