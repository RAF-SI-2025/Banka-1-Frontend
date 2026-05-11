export interface InvestmentFund {
  id: number;
  name: string;
  description: string;
  minimumContribution: number;
  managerId: number;
  managerName?: string;
  accountNumber?: string;
  liquidAssets?: number;
  totalValue?: number;
  profit?: number;
  createdAt?: string;
}

export interface CreateInvestmentFundRequest {
  name: string;
  description: string;
  minimumContribution: number;
  managerId: number;
}

export interface InvestmentFundsPage {
  content: InvestmentFund[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}
