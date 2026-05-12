export interface InvestmentFund {
  id: number;
  naziv: string;
  opis: string;
  minimumContribution: number;
  managerId: number;
  likvidnaSredstva: number;
  accountNumber: string;
  datumKreiranja: string;
  totalValue: number;
  profit: number;
}

export interface ClientFundPosition {
  id: number;
  clientId: number;
  fundId: number;
  totalInvested: number;
  firstInvestedAt: string;
  lastModifiedAt?: string;
}

export interface InvestmentRequest {
  amount: number;
  fromAccountNumber: string;
}

export interface RedemptionRequest {
  amount: number;
  toAccountNumber: string;
}
