import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Installment,
  Loan,
  LoanPage,
  LoanRequest,
  LoanStatus,
  LoanType,
  InterestRateType
} from '../models/loan.model';

const MOCK_LOAN_REQUESTS: LoanRequest[] = [
  { id: 1, loanType: LoanType.CASH, interestRateType: InterestRateType.FIXED, amount: 500000, currency: 'RSD', purpose: 'Kupovina nameštaja', monthlySalary: 120000, employmentStatus: 'EMPLOYED', employmentPeriodMonths: 36, repaymentPeriodMonths: 24, contactPhone: '0641234567', accountNumber: '265-1234567890123-56', housingStatus: 'OWNER', submittedAt: '2026-03-15T10:30:00', status: 'PENDING' },
  { id: 2, loanType: LoanType.MORTGAGE, interestRateType: InterestRateType.VARIABLE, amount: 8000000, currency: 'RSD', purpose: 'Kupovina stana', monthlySalary: 250000, employmentStatus: 'EMPLOYED', employmentPeriodMonths: 60, repaymentPeriodMonths: 240, contactPhone: '0699876543', accountNumber: '265-9876543210987-12', submittedAt: '2026-03-20T14:00:00', status: 'PENDING' },
  { id: 3, loanType: LoanType.AUTO, interestRateType: InterestRateType.FIXED, amount: 2500000, currency: 'RSD', purpose: 'Kupovina automobila', monthlySalary: 180000, employmentStatus: 'SELF_EMPLOYED', employmentPeriodMonths: 48, repaymentPeriodMonths: 60, contactPhone: '0611112233', accountNumber: '265-1111222233334-44', submittedAt: '2026-04-01T09:15:00', status: 'APPROVED' },
  { id: 4, loanType: LoanType.STUDENT, interestRateType: InterestRateType.FIXED, amount: 300000, currency: 'RSD', purpose: 'Školarina', monthlySalary: 60000, employmentStatus: 'PART_TIME', employmentPeriodMonths: 12, repaymentPeriodMonths: 36, contactPhone: '0625556677', accountNumber: '265-5555666677778-88', submittedAt: '2026-04-03T11:45:00', status: 'REJECTED' },
  { id: 5, loanType: LoanType.REFINANCING, interestRateType: InterestRateType.VARIABLE, amount: 1200000, currency: 'RSD', purpose: 'Refinansiranje postojećeg kredita', monthlySalary: 150000, employmentStatus: 'EMPLOYED', employmentPeriodMonths: 24, repaymentPeriodMonths: 48, contactPhone: '0638889900', accountNumber: '265-8888999900001-23', submittedAt: '2026-04-05T16:20:00', status: 'PENDING' },
];

const MOCK_LOANS: Loan[] = [
  { id: 101, loanNumber: 'KR-2025-00101', loanType: LoanType.CASH, interestRateType: InterestRateType.FIXED, amount: 500000, currency: 'RSD', remainingDebt: 320000, contractDate: '2025-01-10', maturityDate: '2027-01-10', repaymentPeriodMonths: 24, installmentAmount: 22500, accountNumber: '265-1234567890123-56', clientName: 'Marko Marković', status: 'ACTIVE', nominalInterestRate: 9.5, effectiveInterestRate: 9.9 },
  { id: 102, loanNumber: 'KR-2024-00082', loanType: LoanType.MORTGAGE, interestRateType: InterestRateType.VARIABLE, amount: 8000000, currency: 'RSD', remainingDebt: 7500000, contractDate: '2024-06-01', maturityDate: '2044-06-01', repaymentPeriodMonths: 240, installmentAmount: 55000, accountNumber: '265-9876543210987-12', clientName: 'Ana Anić', status: 'ACTIVE', nominalInterestRate: 5.5, effectiveInterestRate: 5.7 },
  { id: 103, loanNumber: 'KR-2023-00045', loanType: LoanType.AUTO, interestRateType: InterestRateType.FIXED, amount: 2500000, currency: 'RSD', remainingDebt: 0, contractDate: '2023-03-15', maturityDate: '2026-03-15', repaymentPeriodMonths: 36, installmentAmount: 72000, accountNumber: '265-1111222233334-44', clientName: 'Jovana Jović', status: 'PAID_OFF', nominalInterestRate: 8.0, effectiveInterestRate: 8.3 },
  { id: 104, loanNumber: 'KR-2025-00210', loanType: LoanType.CASH, interestRateType: InterestRateType.FIXED, amount: 300000, currency: 'RSD', remainingDebt: 280000, contractDate: '2025-10-01', maturityDate: '2028-10-01', repaymentPeriodMonths: 36, installmentAmount: 9200, accountNumber: '265-5555666677778-88', clientName: 'Petar Petrović', status: 'DELAYED', nominalInterestRate: 11.0, effectiveInterestRate: 11.5 },
  { id: 105, loanNumber: 'KR-2025-00190', loanType: LoanType.STUDENT, interestRateType: InterestRateType.FIXED, amount: 300000, currency: 'RSD', remainingDebt: 270000, contractDate: '2025-09-01', maturityDate: '2028-09-01', repaymentPeriodMonths: 36, installmentAmount: 8800, accountNumber: '265-8888999900001-23', clientName: 'Milica Milić', status: 'ACTIVE', nominalInterestRate: 3.0, effectiveInterestRate: 3.1 },
];

const MOCK_INSTALLMENTS: Record<number, Installment[]> = {
  101: [
    { id: 1, installmentNumber: 1, expectedDueDate: '2025-02-10', actualPaymentDate: '2025-02-09', amount: 22500, currency: 'RSD', interestRateAtPayment: 9.5, status: 'PAID' },
    { id: 2, installmentNumber: 2, expectedDueDate: '2025-03-10', actualPaymentDate: '2025-03-10', amount: 22500, currency: 'RSD', interestRateAtPayment: 9.5, status: 'PAID' },
    { id: 3, installmentNumber: 3, expectedDueDate: '2025-04-10', actualPaymentDate: null, amount: 22500, currency: 'RSD', interestRateAtPayment: 9.5, status: 'UNPAID' },
  ],
  104: [
    { id: 10, installmentNumber: 1, expectedDueDate: '2025-11-01', actualPaymentDate: '2025-11-03', amount: 9200, currency: 'RSD', interestRateAtPayment: 11.0, status: 'PAID' },
    { id: 11, installmentNumber: 2, expectedDueDate: '2025-12-01', actualPaymentDate: null, amount: 9200, currency: 'RSD', interestRateAtPayment: 11.0, status: 'LATE' },
  ],
};

export interface LoanRequestFilters {
  loanType?: LoanType | string | '';
  accountNumber?: string;
}

export interface EmployeeLoanFilters {
  loanType?: LoanType | string | '';
  accountNumber?: string;
  status?: LoanStatus | string | '';
}

// TODO: set to false when backend is ready
const USE_MOCK = true;

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private readonly loansUrl = `${environment.apiUrl}/api/loans`;
  private readonly myLoansUrl = `${environment.apiUrl}/api/loans/my-loans`;
  private readonly requestsUrl = `${environment.apiUrl}/api/loans/requests`;

  constructor(private readonly http: HttpClient) {}

  getMyLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.myLoansUrl);
  }

  getLoanById(id: string | number): Observable<Loan> {
    return this.http.get<Loan>(`${this.myLoansUrl}/${id}`);
  }

  getLoanInstallments(loanId: string | number): Observable<Installment[]> {
    return this.http.get<Installment[]>(`${this.myLoansUrl}/${loanId}/installments`);
  }

  getLoanRequests(
    filters: LoanRequestFilters = {},
    page = 0,
    size = 10
  ): Observable<LoanPage<LoanRequest>> {
    if (USE_MOCK) {
      let result = [...MOCK_LOAN_REQUESTS];
      if (filters.loanType) result = result.filter(r => r.loanType === filters.loanType);
      if (filters.accountNumber?.trim()) result = result.filter(r => r.accountNumber.includes(filters.accountNumber!.trim()));
      const start = page * size;
      return of({ content: result.slice(start, start + size), totalElements: result.length, totalPages: Math.ceil(result.length / size), number: page, size });
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'submittedAt,desc');

    if (filters.loanType) {
      params = params.set('loanType', String(filters.loanType));
    }

    if (filters.accountNumber?.trim()) {
      params = params.set('accountNumber', filters.accountNumber.trim());
    }

    // TODO
    return this.http.get<LoanPage<LoanRequest>>(this.requestsUrl, { params });
  }

  approveLoanRequest(requestId: number): Observable<void> {
    if (USE_MOCK) {
      const req = MOCK_LOAN_REQUESTS.find(r => r.id === requestId);
      if (req) req.status = 'APPROVED';
      return of(undefined);
    }
    // TODO
    return this.http.post<void>(`${this.requestsUrl}/${requestId}/approve`, {});
  }

  rejectLoanRequest(requestId: number): Observable<void> {
    if (USE_MOCK) {
      const req = MOCK_LOAN_REQUESTS.find(r => r.id === requestId);
      if (req) req.status = 'REJECTED';
      return of(undefined);
    }
    // TODO
    return this.http.post<void>(`${this.requestsUrl}/${requestId}/reject`, {});
  }

  requestLoan(loanRequestDto: any): Observable<any> {
    if (USE_MOCK) {
      return of({
        id: Math.floor(Math.random() * 10000),
        requestNumber: `REQ-${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        message: 'Vaš zahtev za kredit je uspešno primljen.'
      });
    }
    return this.http.post<any>(`${this.requestsUrl}`, loanRequestDto);
  }

  getAllLoans(
    filters: EmployeeLoanFilters = {},
    page = 0,
    size = 10
  ): Observable<LoanPage<Loan>> {
    if (USE_MOCK) {
      let result = [...MOCK_LOANS];
      if (filters.loanType) result = result.filter(l => (l.loanType ?? l.type) === filters.loanType);
      if (filters.accountNumber?.trim()) result = result.filter(l => l.accountNumber?.includes(filters.accountNumber!.trim()));
      if (filters.status) result = result.filter(l => l.status === filters.status);
      const start = page * size;
      return of({ content: result.slice(start, start + size), totalElements: result.length, totalPages: Math.ceil(result.length / size), number: page, size });
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'accountNumber,asc');

    if (filters.loanType) {
      params = params.set('loanType', String(filters.loanType));
    }

    if (filters.accountNumber?.trim()) {
      params = params.set('accountNumber', filters.accountNumber.trim());
    }

    if (filters.status) {
      params = params.set('status', String(filters.status));
    }

    // TODO
    return this.http.get<LoanPage<Loan>>(this.loansUrl, { params });
  }

  getEmployeeLoanById(id: string | number): Observable<Loan> {
    if (USE_MOCK) {
      const loan = MOCK_LOANS.find(l => l.id === id) ?? MOCK_LOANS[0];
      return of(loan);
    }
    // TODO
    return this.http.get<Loan>(`${this.loansUrl}/${id}`);
  }

  getEmployeeLoanInstallments(loanId: string | number): Observable<Installment[]> {
    if (USE_MOCK) {
      return of(MOCK_INSTALLMENTS[loanId as number] ?? []);
    }
    // TODO
    return this.http.get<Installment[]>(`${this.loansUrl}/${loanId}/installments`);
  }
}
