import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';
import { OtcService } from '../../services/otc.service';
import { OtcContract, ContractStatus } from '../../models/otc-contract.model';

@Component({
  selector: 'app-otc-contracts',
  templateUrl: './otc-contracts.component.html',
  styleUrls: ['./otc-contracts.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent]
})
export class OtcContractsComponent implements OnInit {
  public contracts: OtcContract[] = [];
  public filteredContracts: OtcContract[] = [];
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';
  public selectedFilter: 'ALL' | 'ACTIVE' | 'EXPIRED' = 'ACTIVE';
  public executingContractId: string | null = null;
  public Math = Math;

  constructor(private readonly otcService: OtcService) {}

  public ngOnInit(): void {
    this.loadContracts();
  }

  /**
   * Učitava sve OTC ugovore za korisnika
   */
  public loadContracts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.otcService.getMyContracts().subscribe({
      next: (contracts: OtcContract[]) => {
        this.contracts = contracts;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message ||
          error.error?.error ||
          'Greška pri učitavanju ugovora. Pokušajte ponovo.';
      }
    });
  }

  /**
   * Primenjuje filter na listu ugovora
   */
  public applyFilter(): void {
    if (this.selectedFilter === 'ALL') {
      this.filteredContracts = this.contracts;
    } else if (this.selectedFilter === 'ACTIVE') {
      this.filteredContracts = this.contracts.filter(c => c.status === 'ACTIVE');
    } else if (this.selectedFilter === 'EXPIRED') {
      this.filteredContracts = this.contracts.filter(c => c.status === 'EXPIRED');
    }
  }

  /**
   * Proverava da li je ugovor aktivan
   */
  public isActive(contract: OtcContract): boolean {
    return contract.status === 'ACTIVE';
  }

  /**
   * Proverava da li je ugovor istekao
   */
  public isExpired(contract: OtcContract): boolean {
    return contract.status === 'EXPIRED';
  }

  /**
   * Proverava da li je ugovor izvršen
   */
  public isExecuted(contract: OtcContract): boolean {
    return contract.status === 'EXECUTED';
  }

  /**
   * Realizuje (koristi) OTC ugovor - pokreće transakciju kupoprodaje na backend-u
   */
  public executeContract(contractId: string): void {
    if (confirm('Sigurni ste da želite da realizujete ovaj ugovor?')) {
      this.executingContractId = contractId;
      this.successMessage = '';
      this.errorMessage = '';

      this.otcService.executeContract(contractId).subscribe({
        next: (updatedContract: OtcContract) => {
          this.executingContractId = null;

          // Ažurira ugovor u listi
          const index = this.contracts.findIndex(c => c.id === contractId);
          if (index !== -1) {
            this.contracts[index] = updatedContract;
            this.applyFilter();
          }

          this.successMessage = `✓ Ugovor ${updatedContract.contractNumber} je uspešno realizovan!`;

          // Skriva success poruku nakon 4 sekunde
          setTimeout(() => {
            this.successMessage = '';
          }, 4000);
        },
        error: (error: HttpErrorResponse | Error) => {
          this.executingContractId = null;
          const errorMsg = (error as any).message || (error as any).error?.message || error.toString();
          this.errorMessage = errorMsg;
        }
      });
    }
  }

  /**
   * Formata novčani iznos
   */
  public formatAmount(value: number, decimals = 2): string {
    return value.toLocaleString('sr-RS', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formata datum
   */
  public formatDate(date: Date): string {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Proverava da li je datum u budućnosti
   */
  public isFutureDate(date: Date): boolean {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date > new Date();
  }

  /**
   * Vraća CSS klasu za status ugovora
   */
  public getStatusClass(status: ContractStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'EXPIRED':
        return 'status-expired';
      case 'EXECUTED':
        return 'status-executed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Vraća tekst labele za status
   */
  public getStatusLabel(status: ContractStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Aktivan';
      case 'EXPIRED':
        return 'Istekao';
      case 'EXECUTED':
        return 'Realizovan';
      case 'CANCELLED':
        return 'Otkazan';
      default:
        return 'Nepoznat';
    }
  }

  /**
   * Proverava da li je profit pozitivan (dobit)
   */
  public isProfitable(profit: number): boolean {
    return profit > 0;
  }

  /**
   * Vraća boju za profit na osnovu znaka
   */
  public getProfitColor(profit: number): string {
    return this.isProfitable(profit) ? 'text-green-600' : 'text-red-600';
  }

  /**
   * Prebrojava aktivne ugovore
   */
  public getActiveCount(): number {
    return this.filteredContracts.filter(c => c.status === 'ACTIVE').length;
  }

  /**
   * Prebrojava istekle ugovore
   */
  public getExpiredCount(): number {
    return this.filteredContracts.filter(c => c.status === 'EXPIRED').length;
  }

  /**
   * Obračunava ukupan profit
   */
  public getTotalProfit(): number {
    return this.filteredContracts.reduce((sum, c) => sum + c.profit, 0);
  }
}
