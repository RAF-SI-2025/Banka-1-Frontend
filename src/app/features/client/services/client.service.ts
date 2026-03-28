import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { of, delay } from 'rxjs';
import { PaymentRecipient } from '../models/account.model';

export interface ClientDto {
  id: string | number;
  ime?: string;
  prezime?: string;
  datumRodjenja?: number;
  pol?: string;
  email?: string;
  brojTelefona?: string;
  adresa?: string;
}

export interface ClientFilters {
  ime?: string;
  prezime?: string;
  email?: string;
}

export interface ClientPageResponse {
  content: ClientDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface NewPaymentDto {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  recipientName: string;
  paymentCode: string;
  referenceNumber?: string;
  paymentPurpose: string;
  verificationSessionId: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly base = `${environment.apiUrl}/clients/customers`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<ClientDto[]> {
    const page = 0;
    const size = 100;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ClientPageResponse | ClientDto[]>(this.base, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size).content));
  }

  getClients(filters: ClientFilters = {}, page = 0, size = 10): Observable<ClientPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.ime?.trim()) {
      params = params.set('ime', filters.ime.trim());
    }

    if (filters.prezime?.trim()) {
      params = params.set('prezime', filters.prezime.trim());
    }

    if (filters.email?.trim()) {
      params = params.set('email', filters.email.trim());
    }

    return this.http
      .get<ClientPageResponse>(this.base, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));

  }

  getClientById(id: string): Observable<ClientDto> {
    return this.http.get<ClientDto>(`${this.base}/${id}`);
  }

  updateClient(id: string, data: Partial<ClientDto>): Observable<ClientDto> {
    return this.http.put<ClientDto>(`${this.base}/${id}`, data);
  }

  searchClients(query: string, page = 0, size = 10): Observable<ClientPageResponse> {
    const params = new HttpParams()
      .set('query', query.trim())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ClientPageResponse | ClientDto[]>(`${this.base}/search`, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));
  }

  private normalizePageResponse(
    response: ClientPageResponse | ClientDto[],
    page: number,
    size: number
  ): ClientPageResponse {
    const content = Array.isArray(response) ? response : response.content ?? [];
    const totalElements = Array.isArray(response) ? content.length : response.totalElements ?? content.length;
    const resolvedSize = Array.isArray(response) ? size : response.size ?? size;
    const totalPages = Array.isArray(response)
      ? (totalElements === 0 ? 0 : Math.ceil(totalElements / resolvedSize))
      : response.totalPages ?? (totalElements === 0 ? 0 : Math.ceil(totalElements / resolvedSize));

    return {
      content,
      totalElements,
      totalPages,
      number: Array.isArray(response) ? page : response.number ?? page,
      size: resolvedSize
    };
  }
  //Primaoci placanja

  getAllRecipients(accountNumber: string, page = 0, size = 10): Observable<PaymentRecipient[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${environment.apiUrl}/transfers/accounts/${accountNumber}`, { params }).pipe(
      map(res => {
        if (!res.content) return res;
        return res.content;
      })
    );
  }

  createPayment(dto: NewPaymentDto): Observable<string> {
    return this.http.post(`${environment.apiUrl}/transactions/payments`, dto, { responseType: 'text' });
  }

  updateRecipient(id: number, name: string, accountNumber: string): Observable<PaymentRecipient> {
    return this.http.put<PaymentRecipient>(`${environment.apiUrl}/transactions/api/payments/${id}`, { name, accountNumber });
  }

  deleteRecipient(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/transactions/api/payments/${id}`);
  }


}
