import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Installment,
  InstallmentStatus,
  Loan,
  LoanPage,
  LoanRequest,
  LoanStatus,
  LoanType,
  InterestRateType
} from '../models/loan.model';

export interface LoanRequestFilters {
  loanType?: LoanType | string | '';
  accountNumber?: string;
}

export interface EmployeeLoanFilters {
  loanType?: LoanType | string | '';
  accountNumber?: string;
  status?: LoanStatus | string | '';
}

/* Backend (credit-service) shape iz GET /credit/api/loans/{loanNumber}:
   - bundle: { loan: { loanNumber, loanType, agreementDate, maturityDate, installmentAmount,
              nextInstallmentDate, repaymentMethod, nominalInterestRate, effectiveInterestRate,
              remainingDebt, amount, accountNumber, interestType, status }, installments: [...] }
   - list iz GET /credit/api/loans/client vraca samo {amount, loanNumber, loanType, status} */
interface BackendLoan {
  loanNumber?: number | string;
  loanType?: string;
  agreementDate?: string;
  maturityDate?: string;
  installmentAmount?: number;
  nextInstallmentDate?: string;
  repaymentMethod?: number;
  nominalInterestRate?: number;
  effectiveInterestRate?: number;
  remainingDebt?: number;
  amount: number;
  accountNumber?: string;
  interestType?: string;
  status: string;
  currency?: string;
}

interface BackendInstallment {
  expectedDueDate: string;
  actualDueDate?: string | null;
  installmentAmount: number;
  interestRateAtPayment: number;
  paymentStatus: string;
  currency: string;
}

interface BackendLoanInfoResponse {
  loan: BackendLoan;
  installments: BackendInstallment[];
}

function mapBackendLoan(b: BackendLoan): Loan {
  return {
    id: b.loanNumber ?? 0,
    number: b.loanNumber !== undefined ? String(b.loanNumber) : undefined,
    loanNumber: b.loanNumber !== undefined ? String(b.loanNumber) : undefined,
    type: (b.loanType as LoanType) ?? undefined,
    loanType: (b.loanType as LoanType) ?? undefined,
    amount: b.amount,
    currency: b.currency ?? 'RSD',
    status: b.status as LoanStatus,
    remainingDebt: b.remainingDebt ?? b.amount,
    contractDate: b.agreementDate ?? '',
    dueDate: b.maturityDate,
    maturityDate: b.maturityDate,
    repaymentPeriod: b.repaymentMethod,
    repaymentPeriodMonths: b.repaymentMethod,
    nextInstallmentAmount: b.installmentAmount,
    installmentAmount: b.installmentAmount,
    nextInstallmentDate: b.nextInstallmentDate,
    nominalInterestRate: b.nominalInterestRate,
    effectiveInterestRate: b.effectiveInterestRate,
    accountNumber: b.accountNumber,
    interestRateType: (b.interestType as InterestRateType) ?? undefined,
  };
}

function mapBackendInstallment(b: BackendInstallment): Installment {
  const statusMap: Record<string, InstallmentStatus> = { PAID: 'PAID', UNPAID: 'UNPAID', LATE: 'LATE' };
  return {
    expectedDueDate: b.expectedDueDate,
    actualPaymentDate: b.actualDueDate ?? null,
    amount: b.installmentAmount,
    currency: b.currency,
    interestRateAtPayment: b.interestRateAtPayment,
    status: statusMap[b.paymentStatus] ?? 'UNPAID',
  };
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private readonly loansUrl = `${environment.apiUrl}/credit/api/loans`;
  private readonly myLoansUrl = `${environment.apiUrl}/credit/api/loans/client`;
  private readonly requestsUrl = `${environment.apiUrl}/credit/api/loans/requests`;

  /* In-memory cache za installments — getLoanById vraca {loan, installments} bundle,
     pa getLoanInstallments povuce iz cache-a umesto da pravi (nepostojeci) drugi HTTP poziv. */
  private installmentsCache = new Map<string, Installment[]>();

  constructor(private readonly http: HttpClient) {}

  getMyLoans(): Observable<Loan[]> {
    return this.http.get<LoanPage<BackendLoan>>(this.myLoansUrl).pipe(
      map(page => (page.content || []).map(mapBackendLoan))
    );
  }

  /**
   * PR_31 hotfix: backend ima `GET /credit/api/loans/{loanNumber}` (NE `/client/{id}`).
   * Endpoint vraca bundle `{loan, installments}`. Mapiramo na frontend Loan + cache
   * installments za naredni `getLoanInstallments` poziv (ne pravi novi HTTP request).
   */
  getLoanById(loanNumber: string | number): Observable<Loan> {
    return this.http.get<BackendLoanInfoResponse>(`${this.loansUrl}/${loanNumber}`).pipe(
      tap(resp => this.installmentsCache.set(String(loanNumber), (resp.installments || []).map(mapBackendInstallment))),
      map(resp => {
        const loan = mapBackendLoan(resp.loan);
        const firstInst = (resp.installments && resp.installments[0]) || undefined;
        if (firstInst && !loan.currency) loan.currency = firstInst.currency;
        return loan;
      })
    );
  }

  /** Vraca cache-irane installments iz prethodnog getLoanById poziva.  */
  getLoanInstallments(loanNumber: string | number): Observable<Installment[]> {
    const cached = this.installmentsCache.get(String(loanNumber));
    return of(cached ?? []);
  }

  getLoanRequests(
    filters: LoanRequestFilters = {},
    page = 0,
    size = 10
  ): Observable<LoanPage<LoanRequest>> {
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

  approveLoanRequest(requestId: number): Observable<string> {
    return this.http.put<string>(`${this.requestsUrl}/${requestId}/approve`, {}, { responseType: 'text' as 'json' });
  }

  rejectLoanRequest(requestId: number): Observable<string> {
    return this.http.put<string>(`${this.requestsUrl}/${requestId}/decline`, {}, { responseType: 'text' as 'json' });
  }

  requestLoan(loanRequestDto: any): Observable<any> {
    return this.http.post<any>(`${this.requestsUrl}`, loanRequestDto);
  }

  getAllLoans(
    filters: EmployeeLoanFilters = {},
    page = 0,
    size = 10
  ): Observable<LoanPage<Loan>> {
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
    return this.http.get<LoanPage<Loan>>(this.loansUrl + '/all', { params });
  }

  getEmployeeLoanById(id: string | number): Observable<Loan> {
    // TODO
    return this.http.get<Loan>(`${this.loansUrl}/${id}`);
  }

  getEmployeeLoanInstallments(loanId: string | number): Observable<Installment[]> {
    // TODO
    return this.http.get<Installment[]>(`${this.loansUrl}/${loanId}/installments`);
  }
}
