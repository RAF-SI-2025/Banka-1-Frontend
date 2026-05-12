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

export enum LoanType {
  GOTOVINSKI = 'GOTOVINSKI',
  STAMBENI = 'STAMBENI',
  AUTO = 'AUTO',
  STUDENT = 'STUDENT',
  REFINANCIRANJE = 'REFINANCIRANJE',
  POSLOVNI = 'POSLOVNI'
}

// Tip za opcije kredita (bez POSLOVNI)
export type LoanTypeOption = Exclude<LoanType, LoanType.POSLOVNI>;

/**
 * Labele za vrste kredita
 */
export const LoanTypeLabels: Record<string, string> = {
  [LoanType.GOTOVINSKI]: 'Gotovinski kredit',
  [LoanType.STAMBENI]: 'Stambeni kredit',
  [LoanType.AUTO]: 'Auto kredit',
  [LoanType.STUDENT]: 'Studentski kredit',
  [LoanType.REFINANCIRANJE]: 'Refinansirajući kredit',
  [LoanType.POSLOVNI]: 'Poslovni kredit'
};

/**
 * Periodi otplate za različite vrste kredita (u mesecima)
 */
export const LoanRepaymentTerms: Record<string, number[]> = {
  [LoanType.GOTOVINSKI]: [12, 24, 36, 48, 60, 72, 84],
  [LoanType.AUTO]: [12, 24, 36, 48, 60, 72, 84],
  [LoanType.STAMBENI]: [60, 120, 180, 240, 300, 360],
  [LoanType.STUDENT]: [12, 24, 36, 48, 60, 72, 84],
  [LoanType.REFINANCIRANJE]: [12, 24, 36, 48, 60, 72, 84]
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
export const InterestRateTypeLabels: Record<string, string> = {
  [InterestRateType.FIXED]: 'Fiksna',
  [InterestRateType.VARIABLE]: 'Varijabilna'
};

export enum Currency {
  RSD = 'RSD',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD'
}

/**
 * Labele za valute sa opisima — pun spec Celina 2 set valuta:
 * RSD, EUR, CHF, USD, GBP, JPY, CAD, AUD.
 */
export const CurrencyLabels: Record<Currency, string> = {
  [Currency.RSD]: 'RSD - Srpski dinar',
  [Currency.EUR]: 'EUR - Evro',
  [Currency.USD]: 'USD - američki dolar',
  [Currency.GBP]: 'GBP - britanska funta',
  [Currency.CHF]: 'CHF - švajcarski franak',
  [Currency.JPY]: 'JPY - japanski jen',
  [Currency.CAD]: 'CAD - kanadski dolar',
  [Currency.AUD]: 'AUD - australijski dolar'
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

/**
 * DTO za zahtev za kredit
 */
export interface LoanRequestDto {
  loanType: LoanType | string;
  interestType: InterestRateType | string;
  amount: number;
  currency: string;
  purpose: string;
  monthlySalary: number;
  employmentStatus: string;
  currentEmploymentPeriod: number;
  accountNumber: string;
  contactPhone: string;
  repaymentPeriod: number;
}

/**
 * Response za zahtev za kredit
 */
export interface LoanRequestResponse {
  id: number;
  requestNumber: string;
  status: LoanRequestStatus;
  createdAt: string;
  message?: string;
}

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
  interestRateType?: InterestRateType | string;
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
  interestRateType: InterestRateType | string;
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
