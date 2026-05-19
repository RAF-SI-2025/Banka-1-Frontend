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
  annualYield?: number | null;
  rewardToVariabilityRatio?: number | null;
  maxDrawdown?: number | null;
  volatility?: number | null;
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
