export type LoanStatus =
  | 'APPROVED'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'DELAYED'
  | 'REPAID'
  | 'PAID_OFF'
  | 'REJECTED';

export type LoanRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type InterestRateType = 'FIXED' | 'VARIABLE';

export enum LoanType {
  MORTGAGE = 'MORTGAGE',
  PERSONAL = 'PERSONAL',
  CASH = 'CASH',
  AUTO = 'AUTO',
  STUDENT = 'STUDENT',
  REFINANCING = 'REFINANCING',
  BUSINESS = 'BUSINESS'
}

/**
 * Labele za vrste kredita
 */
export const LoanTypeLabels: Record<LoanTypeOption | 'BUSINESS', string> = {
  [LoanTypeOption.PERSONAL]: 'Keš kredit',
  [LoanTypeOption.MORTGAGE]: 'Stambeni kredit',
  [LoanTypeOption.AUTO]: 'Auto kredit',
  [LoanTypeOption.STUDENT]: 'Studentski kredit',
  [LoanTypeOption.REFINANCING]: 'Refinansirajući kredit',
  'BUSINESS': 'Poslovni kredit'
};

/**
 * Periodi otplate za različite vrste kredita (u mesecima)
 */
export const LoanRepaymentTerms: Record<LoanTypeOption, number[]> = {
  [LoanTypeOption.PERSONAL]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.AUTO]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.MORTGAGE]: [60, 120, 180, 240, 300, 360],
  [LoanTypeOption.STUDENT]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.REFINANCING]: [12, 24, 36, 48, 60, 72, 84]
};

/**
 * Enumeracija za tip kamatne stope
 */
export enum InterestRateType {
  FIXED = 'FIXED',       // Fiksna
  VARIABLE = 'VARIABLE'  // Varijabilna
}

/**
 * Labele za tip kamatne stope
 */
export const InterestRateTypeLabels: Record<InterestRateType, string> = {
  [InterestRateType.FIXED]: 'Fiksna',
  [InterestRateType.VARIABLE]: 'Varijabilna'
};


/**
 * Enumeracija za valute
 */
export enum Currency {
  RSD = 'RSD',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF'
}

/**
 * Labele za valute sa opisima
 */
export const CurrencyLabels: Record<Currency, string> = {
  [Currency.RSD]: 'RSD - Srpski dinar',
  [Currency.EUR]: 'EUR - Evro',
  [Currency.USD]: 'USD - američki dolar',
  [Currency.GBP]: 'GBP - britanska funta',
  [Currency.CHF]: 'CHF - švajcarski franak'
};

/**
 * Enumeracija za status zaposlenja
 */
export enum EmploymentStatus {
  PERMANENT = 'PERMANENT',   // Stalno
  TEMPORARY = 'TEMPORARY',   // Privremeno
  UNEMPLOYED = 'UNEMPLOYED'  // Nezaposlen
}

/**
 * Labele za status zaposlenja
 */
export const EmploymentStatusLabels: Record<EmploymentStatus, string> = {
  [EmploymentStatus.PERMANENT]: 'Stalno',
  [EmploymentStatus.TEMPORARY]: 'Privremeno',
  [EmploymentStatus.UNEMPLOYED]: 'Nezaposlen'
};


export type InstallmentStatus = 'PAID' | 'UNPAID' | 'LATE';

export const InstallmentStatusLabels: Record<InstallmentStatus, string> = {
  PAID: 'Plaćeno',
  UNPAID: 'Neplaćeno',
  LATE: 'Kasni'
};

export const LoanTypeLabels: Record<string, string> = {
  PERSONAL: 'Gotovinski kredit',
  CASH: 'Gotovinski kredit',
  MORTGAGE: 'Stambeni kredit',
  AUTO: 'Auto kredit',
  STUDENT: 'Studentski kredit',
  REFINANCING: 'Refinansirajući kredit',
  BUSINESS: 'Poslovni kredit'
};

export const LoanStatusLabels: Record<string, string> = {
  APPROVED: 'Odobren',
  ACTIVE: 'Odobren',
  OVERDUE: 'U kašnjenju',
  DELAYED: 'U kašnjenju',
  REPAID: 'Otplaćen',
  PAID_OFF: 'Otplaćen',
  REJECTED: 'Odbijen'
};

export const LoanRequestStatusLabels: Record<LoanRequestStatus, string> = {
  PENDING: 'Na čekanju',
  APPROVED: 'Odobren',
  REJECTED: 'Odbijen'
};

export const InterestRateTypeLabels: Record<InterestRateType, string> = {
  FIXED: 'Fiksna',
  VARIABLE: 'Varijabilna'
};

export interface Installment {
  id?: number | string;
  installmentNumber?: number;
  expectedDueDate: string;
  actualPaymentDate?: string | null;
  amount: number;
  currency: string;
  interestRateAtPayment: number;
  status: InstallmentStatus;
}

export interface Loan {
  id: string | number;

  type?: LoanType | string;
  number?: string;
  dueDate?: string;
  repaymentPeriod?: number;
  nextInstallmentAmount?: number;

  loanType?: LoanType | string;
  creditType?: LoanType | string;
  loanNumber?: string;
  creditNumber?: string;
  interestRateType?: InterestRateType;
  maturityDate?: string;
  repaymentPeriodMonths?: number;
  accountNumber?: string;
  installmentAmount?: number;
  clientName?: string;

  amount: number;
  currency: string;
  status: LoanStatus | string;
  remainingDebt: number;
  contractDate: string;
  nominalInterestRate?: number;
  effectiveInterestRate?: number;
  nextInstallmentDate?: string;
}

export interface LoanRequest {
  id: number;
  loanType: LoanType | string;
  interestRateType: InterestRateType;
  amount: number;
  currency: string;
  purpose: string;
  monthlySalary: number;
  employmentStatus: string;
  employmentPeriodMonths: number;
  repaymentPeriodMonths: number;
  contactPhone: string;
  accountNumber: string;
  housingStatus?: string;
  submittedAt: string;
  status: LoanRequestStatus;
}

export interface LoanPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
