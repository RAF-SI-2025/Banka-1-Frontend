import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OtcContractsComponent } from './otc-contracts.component';
import { OtcService } from '../../services/otc.service';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';
import { of } from 'rxjs';
import { OtcContract } from '../../models/otc-contract.model';

describe('OtcContractsComponent', () => {
  let component: OtcContractsComponent;
  let fixture: ComponentFixture<OtcContractsComponent>;
  let otcService: OtcService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtcContractsComponent, CommonModule, FormsModule, NavbarComponent],
      providers: [OtcService]
    }).compileComponents();

    fixture = TestBed.createComponent(OtcContractsComponent);
    component = fixture.componentInstance;
    otcService = TestBed.inject(OtcService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contracts on init', () => {
    spyOn(component, 'loadContracts');
    component.ngOnInit();
    expect(component.loadContracts).toHaveBeenCalled();
  });

  it('should load mock contracts successfully', (done) => {
    component.loadContracts();
    
    setTimeout(() => {
      expect(component.isLoading).toBe(false);
      expect(component.contracts.length).toBeGreaterThan(0);
      expect(component.filteredContracts.length).toBeGreaterThan(0);
      done();
    }, 400);
  });

  it('should filter contracts by ACTIVE status', () => {
    component.contracts = [
      { status: 'ACTIVE' } as OtcContract,
      { status: 'EXPIRED' } as OtcContract,
      { status: 'ACTIVE' } as OtcContract
    ];

    component.selectedFilter = 'ACTIVE';
    component.applyFilter();

    expect(component.filteredContracts.length).toBe(2);
    expect(component.filteredContracts.every(c => c.status === 'ACTIVE')).toBe(true);
  });

  it('should filter contracts by EXPIRED status', () => {
    component.contracts = [
      { status: 'ACTIVE' } as OtcContract,
      { status: 'EXPIRED' } as OtcContract,
      { status: 'EXPIRED' } as OtcContract
    ];

    component.selectedFilter = 'EXPIRED';
    component.applyFilter();

    expect(component.filteredContracts.length).toBe(2);
    expect(component.filteredContracts.every(c => c.status === 'EXPIRED')).toBe(true);
  });

  it('should show all contracts with ALL filter', () => {
    component.contracts = [
      { status: 'ACTIVE' } as OtcContract,
      { status: 'EXPIRED' } as OtcContract,
      { status: 'EXECUTED' } as OtcContract
    ];

    component.selectedFilter = 'ALL';
    component.applyFilter();

    expect(component.filteredContracts.length).toBe(3);
  });

  it('should correctly identify active contracts', () => {
    const activeContract = { status: 'ACTIVE' } as OtcContract;
    const expiredContract = { status: 'EXPIRED' } as OtcContract;

    expect(component.isActive(activeContract)).toBe(true);
    expect(component.isActive(expiredContract)).toBe(false);
  });

  it('should correctly identify expired contracts', () => {
    const activeContract = { status: 'ACTIVE' } as OtcContract;
    const expiredContract = { status: 'EXPIRED' } as OtcContract;

    expect(component.isExpired(activeContract)).toBe(false);
    expect(component.isExpired(expiredContract)).toBe(true);
  });

  it('should execute contract successfully', (done) => {
    component.contracts = [
      {
        id: 'otc-001',
        status: 'ACTIVE',
        contractNumber: 'OTC-2024-001'
      } as OtcContract
    ];
    component.selectedFilter = 'ACTIVE';
    component.applyFilter();

    spyOn(window, 'confirm').and.returnValue(true);

    component.executeContract('otc-001');

    setTimeout(() => {
      expect(component.successMessage).toBeTruthy();
      done();
    }, 900);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatAmount(1234.567, 2);
    expect(formatted).toContain('1');
    expect(formatted.includes('234')).toBe(true);
  });

  it('should format date correctly', () => {
    const date = new Date('2026-05-09');
    const formatted = component.formatDate(date);
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  it('should correctly identify profitable contracts', () => {
    expect(component.isProfitable(100)).toBe(true);
    expect(component.isProfitable(-100)).toBe(false);
    expect(component.isProfitable(0)).toBe(false);
  });

  it('should return correct profit color class', () => {
    expect(component.getProfitColor(100)).toContain('green');
    expect(component.getProfitColor(-100)).toContain('red');
  });

  it('should return correct status label', () => {
    expect(component.getStatusLabel('ACTIVE')).toBe('Aktivan');
    expect(component.getStatusLabel('EXPIRED')).toBe('Istekao');
    expect(component.getStatusLabel('EXECUTED')).toBe('Realizovan');
    expect(component.getStatusLabel('CANCELLED')).toBe('Otkazan');
  });

  it('should identify future dates correctly', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    expect(component.isFutureDate(futureDate)).toBe(true);
    expect(component.isFutureDate(pastDate)).toBe(false);
  });
});
