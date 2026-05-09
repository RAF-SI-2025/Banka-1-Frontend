import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OtcService } from './otc.service';
import { OtcContract } from '../models/otc-contract.model';

describe('OtcService', () => {
  let service: OtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OtcService]
    });
    service = TestBed.inject(OtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load mock contracts', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      expect(contracts).toBeTruthy();
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should have ACTIVE and EXPIRED contracts in mock data', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      const hasActive = contracts.some(c => c.status === 'ACTIVE');
      const hasExpired = contracts.some(c => c.status === 'EXPIRED');

      expect(hasActive).toBe(true);
      expect(hasExpired).toBe(true);
      done();
    });
  });

  it('should have valid contract structure', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      const contract = contracts[0];

      expect(contract.id).toBeTruthy();
      expect(contract.contractNumber).toBeTruthy();
      expect(contract.stock).toBeTruthy();
      expect(contract.stock.symbol).toBeTruthy();
      expect(contract.stock.currentPrice).toBeGreaterThan(0);
      expect(contract.amount).toBeGreaterThan(0);
      expect(contract.strikePrice).toBeGreaterThan(0);
      expect(contract.premium).toBeGreaterThan(0);
      expect(contract.settlementDate).toBeTruthy();
      expect(contract.seller).toBeTruthy();
      expect(contract.status).toBeTruthy();
      done();
    });
  });

  it('should execute contract successfully', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      const contractId = contracts[0].id;

      service.executeContract(contractId).subscribe((result: OtcContract) => {
        expect(result).toBeTruthy();
        expect(result.status).toBe('EXECUTED');
        expect(result.executionDate).toBeTruthy();
        done();
      });
    });
  });

  it('should throw error for non-existent contract execution', (done) => {
    service.executeContract('non-existent-id').subscribe(
      () => {
        fail('Should have thrown an error');
      },
      (error) => {
        expect(error).toBeTruthy();
        expect(error.message).toContain('not found');
        done();
      }
    );
  });

  it('should have seller information in contracts', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      const contract = contracts[0];

      expect(contract.seller.id).toBeTruthy();
      expect(contract.seller.name).toBeTruthy();
      expect(contract.seller.bankName).toBeTruthy();
      expect(contract.seller.bankCode).toBeTruthy();
      done();
    });
  });

  it('should have positive or negative profit', (done) => {
    service.getMyContracts().subscribe((contracts: OtcContract[]) => {
      contracts.forEach(contract => {
        expect(typeof contract.profit).toBe('number');
      });
      done();
    });
  });
});
