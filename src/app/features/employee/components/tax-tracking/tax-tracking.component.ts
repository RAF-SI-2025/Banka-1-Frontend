import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxService } from '../../services/tax.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { TaxUser, TaxUserDisplay } from '../../models/tax-user.model';


@Component({
  selector: 'app-tax-tracking',
  templateUrl: './tax-tracking.component.html',
  styleUrls: ['./tax-tracking.component.css'],
  standalone: true, 
  imports: [CommonModule, FormsModule], 
})
export class TaxTrackingComponent implements OnInit {
  
  users: TaxUserDisplay[] = [];
  filteredUsers: TaxUserDisplay[] = [];
  
  searchTerm: string = '';
  userTypeFilter: string = 'ALL';
  
  isLoading: boolean = false;
  isProcessing: boolean = false;

  constructor(private taxService: TaxService, private toastService: ToastService) {}
  
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.taxService.getTaxDebtors().subscribe({
      next: (response: any) => {
        // Backend vraća Page objekat, podaci su u 'content'
        const taxUsers: TaxUser[] = response.content || [];
        // Mapujem backend podatke na display format
        this.users = taxUsers.map(user => ({
          firstName: user.firstName,
          lastName: user.lastName,
          type: user.userType,
          baseAmount: 0, // Backend ne vraća osnovicu
          taxDebt: user.taxDebtRsd, // Mapujem taxDebtRsd na taxDebt
        }));
        this.filterData();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju:', err);
        this.isLoading = false;
      }
    });
  }

  filterData(): void {
    this.filteredUsers = this.users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(this.searchTerm.toLowerCase().trim());
      const matchesType = this.userTypeFilter === 'ALL' || user.type === this.userTypeFilter;
      return matchesSearch && matchesType;
    });
  }

  startTaxCalculation(): void {
      this.isProcessing = true;
      
      this.taxService.triggerTaxCalculation().subscribe({
        next: () => {
          this.toastService.success('Obračun poreza je uspešno pokrenut i naplaćen.');
          this.loadData(); 
          this.isProcessing = false;
        },
        error: (err: any) => {
          console.error('Greška pri obračunu:', err);
          this.toastService.error('Greška pri obračunu poreza.');
          this.isProcessing = false;
        }
      });
    
  }
}