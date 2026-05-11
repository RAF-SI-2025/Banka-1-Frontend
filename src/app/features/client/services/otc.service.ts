import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OtcContract, OtcContractResponse, StockInfo } from '../models/otc-contract.model';

interface OtcOffer {
  id: string;
  symbol: string;
  quantity: number;
  strikePrice: number;
  premium: number;
  expirationDate: string;
}

interface InterbankData {
  bankCode: string;
  bankName: string;
  offersCount: number;
  activateContracts: number;
}

@Injectable({ providedIn: 'root' })
export class OtcService {
  private readonly baseUrl = `${environment.apiUrl}/otc`;

  constructor(private http: HttpClient) {}

  /**
   * Učitava sve OTC ugovore za korisnika sa backend-a
   */
  getMyContracts(): Observable<OtcContract[]> {
    return this.http.get<OtcContractResponse[]>(`${this.baseUrl}/contracts`).pipe(
      map(contracts => contracts.map(c => this.mapToContract(c)))
    );
  }

  /**
   * Koristi (realizuje) OTC ugovor - Pokreće SAGA transakciju na backend-u
   */
  executeContract(contractId: string): Observable<OtcContract> {
    return this.http.post<OtcContractResponse>(`${this.baseUrl}/contracts/${contractId}/execute`, {}).pipe(
      map(response => this.mapToContract(response))
    );
  }

  /**
   * Učitava sve dostupne OTC ponude sa backend-a
   */
  getOffers(): Observable<OtcOffer[]> {
    return this.http.get<OtcOffer[]>(`${this.baseUrl}/offers`);
  }

  /**
   * Učitava listu javnih akcija dostupnih za OTC trading
   */
  getPublicStocks(): Observable<StockInfo[]> {
    return this.http.get<StockInfo[]>(`${this.baseUrl}/public-stocks`);
  }

  /**
   * Učitava interbankarske podatke za OTC transakcije
   */
  getInterbankData(): Observable<InterbankData[]> {
    return this.http.get<InterbankData[]>(`${this.baseUrl}/interbank`);
  }

  /**
   * Mapira OTC ugovor iz backend formata
   */
  private mapToContract(contractResponse: OtcContractResponse): OtcContract {
    return {
      ...contractResponse,
      settlementDate: new Date(contractResponse.settlementDate),
      createdDate: new Date(contractResponse.createdDate),
      executionDate: contractResponse.executionDate ? new Date(contractResponse.executionDate) : undefined
    };
  }
}
