export interface InvestmentFund {
  id: number;
  naziv: string;
  opis: string;
  minimumContribution: number;
  managerId: number;
  managerIme?: string;
  managerPrezime?: string;
  likvidnaSredstva: number;
  accountNumber: string;
  accountId?: number;
  datumKreiranja: string;
  totalValue: number;
  profit: number;
  // WP-26 (Celina 4 — statistika fondova): performance metrike sa backend-a.
  // Sve su frakcije (0.12 = 12%) i null kad fond nema dovoljno snapshot-ova.
  annualizedReturn: number | null;
  rewardToVariability: number | null;
  maxDrawdown: number | null;
  volatility: number | null;
}

/**
 * WP-26: rezultat `GET /funds/{id}/statistics`. `metricsAvailable=false` znaci da
 * fond jos uvek nema dovoljno istorijskih snapshot-ova — tada su sve metrike null.
 */
export interface FundStatistics {
  metricsAvailable: boolean;
  annualizedReturn: number | null;
  rewardToVariability: number | null;
  maxDrawdown: number | null;
  volatility: number | null;
}

/**
 * WP-26: jedna tacka u istoriji vrednosti fonda (`FundValueSnapshot`).
 * Koristi se i za seriju jednog fonda (`/funds/{id}/value-history`) i za
 * sistemski prosek (`/funds/value-history/average`).
 */
export interface FundValueSnapshotPoint {
  snapshotDate: string;
  totalValue: number;
  profit: number;
}

export interface ClientFundPosition {
  id: number;
  clientId: number;
  fundId: number;
  fundNaziv?: string;
  fundOpis?: string;
  fundTotalValue?: number;
  totalInvested: number;
  percentageOfFund: number;
  currentPositionValue: number;
  clientProfit: number;
  firstInvestedAt: string;
  lastModifiedAt?: string;
}

export interface FundHolding {
  id: number;
  ticker: string;
  quantity: number;
  avgUnitPrice: number;
  initialMarginCost: number;
  price: number | null;
  change: number | null;
  volume: number | null;
  acquisitionDate: string;
}

export interface SellResult {
  ticker: string;
  quantitySold: number;
  unitPrice: number;
  proceeds: number;
}

export interface ClientFundTransaction {
  id: number;
  clientId: number;
  fundId: number;
  amount: number;
  inflow: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  occurredAt: string;
  clientAccountNumber: string;
  failureReason?: string | null;
}

export interface InvestmentRequest {
  amount: number;
  fromAccountNumber: string;
}

export interface RedemptionRequest {
  amount: number;
  toAccountNumber: string;
}

export interface BankInvestRequest {
  amount: number;
  fromAccountNumber: string;
}

export interface BankRedeemRequest {
  amount: number;
  toAccountNumber: string;
}
