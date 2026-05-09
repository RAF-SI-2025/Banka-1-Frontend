import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { OtcContract, OtcContractResponse } from '../models/otc-contract.model';

@Injectable({ providedIn: 'root' })
export class OtcService {
  // private readonly baseUrl = `${environment.apiUrl}/otc-contracts`;
  private useMockData = true; // Postavljeno na true za početak sa mock podacima

  constructor(private http: HttpClient) {}

  /**
   * Dohvata sve OTC ugovore za trenutnog korisnika
   * Mock podaci su prikazani dok backend nije dostupan
   */
  getMyContracts(): Observable<OtcContract[]> {
    if (this.useMockData) {
      return of(this.getMockContracts()).pipe(delay(300));
    }

    // // Real API call
    // return this.http.get<OtcContractResponse[]>(this.baseUrl).pipe(
    //   map(contracts => contracts.map(c => this.mapToContract(c)))
    // );

    return of([]).pipe(delay(300));
  }

  /**
   * Koristi (realizuje) OTC ugovor - pokreće transakciju kupoprodaje
   * Implementira se SAGA pattern za konzistentnost:
   * 1. Rezervacija sredstava
   * 2. Provera dostupnosti hartija
   * 3. Transfer vlasništva
   */
  executeContract(contractId: string): Observable<OtcContract> {
    if (this.useMockData) {
      // Mock implementacija - simulira SAGA pattern
      return of(this.executeContractMock(contractId)).pipe(delay(800));
    }

    // // Real API call
    // return this.http.post<OtcContractResponse>(
    //   `${this.baseUrl}/${contractId}/execute`,
    //   {}
    // ).pipe(
    //   map(c => this.mapToContract(c))
    // );

    return of({} as OtcContract).pipe(delay(800));
  }

  /**
   * MOCK PODACI - OTC ugovori
   */
  private getMockContracts(): OtcContract[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dana unapred
    const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);    // 10 dana unazad

    return [
      {
        id: 'otc-001',
        contractNumber: 'OTC-2024-001',
        stock: {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 250.50,
          currency: 'USD'
        },
        amount: 100,
        strikePrice: 240.00,
        premium: 2500.00,
        settlementDate: futureDate,
        seller: {
          id: 'emp-001',
          name: 'John Doe',
          bankName: 'Bank A',
          bankCode: 'BANKA'
        },
        profit: 1050.00,
        status: 'ACTIVE',
        createdDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        totalValue: 24000.00
      },
      {
        id: 'otc-002',
        contractNumber: 'OTC-2024-002',
        stock: {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          currentPrice: 380.25,
          currency: 'USD'
        },
        amount: 50,
        strikePrice: 370.00,
        premium: 1850.00,
        settlementDate: futureDate,
        seller: {
          id: 'emp-002',
          name: 'Jane Smith',
          bankName: 'Bank B',
          bankCode: 'BANKB'
        },
        profit: 512.50,
        status: 'ACTIVE',
        createdDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalValue: 18500.00
      },
      {
        id: 'otc-003',
        contractNumber: 'OTC-2024-003',
        stock: {
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          currentPrice: 140.75,
          currency: 'USD'
        },
        amount: 75,
        strikePrice: 135.00,
        premium: 3200.00,
        settlementDate: pastDate,
        seller: {
          id: 'emp-003',
          name: 'Robert Johnson',
          bankName: 'Bank C',
          bankCode: 'BANKC'
        },
        profit: 2306.25,
        status: 'EXPIRED',
        createdDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        totalValue: 10125.00
      },
      {
        id: 'otc-004',
        contractNumber: 'OTC-2024-004',
        stock: {
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          currentPrice: 245.80,
          currency: 'USD'
        },
        amount: 200,
        strikePrice: 235.00,
        premium: 4200.00,
        settlementDate: futureDate,
        seller: {
          id: 'emp-001',
          name: 'John Doe',
          bankName: 'Bank A',
          bankCode: 'BANKA'
        },
        profit: 1960.00,
        status: 'ACTIVE',
        createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        totalValue: 47000.00
      },
      {
        id: 'otc-005',
        contractNumber: 'OTC-2024-005',
        stock: {
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          currentPrice: 180.50,
          currency: 'USD'
        },
        amount: 150,
        strikePrice: 175.00,
        premium: 3100.00,
        settlementDate: pastDate,
        seller: {
          id: 'emp-002',
          name: 'Jane Smith',
          bankName: 'Bank B',
          bankCode: 'BANKB'
        },
        profit: 825.00,
        status: 'EXPIRED',
        createdDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
        totalValue: 26250.00
      }
    ];
  }

  /**
   * Mock implementacija izvršavanja ugovora
   * Simulira SAGA pattern sa koracima:
   * 1. Rezervacija sredstava
   * 2. Provera hartija
   * 3. Transfer vlasništva
   */
  private executeContractMock(contractId: string): OtcContract {
    const contracts = this.getMockContracts();
    const contract = contracts.find(c => c.id === contractId);

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    // Simulacija promene statusa nakon izvršavanja
    return {
      ...contract,
      status: 'EXECUTED',
      executionDate: new Date()
    };
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
