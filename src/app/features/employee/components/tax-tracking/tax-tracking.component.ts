import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';
import { TaxService } from '../../services/tax.service';
import { TaxUser } from '../../models/tax-user.model';


@Component({
  selector: 'app-tax-tracking',
  templateUrl: './tax-tracking.component.html',
  styleUrls: ['./tax-tracking.component.css'],
  standalone: true, 
  imports: [CommonModule, FormsModule, NavbarComponent], 
})
export class TaxTrackingComponent implements OnInit {
  
  users: TaxUser[] = [];
  filteredUsers: TaxUser[] = [];
  
  searchTerm: string = '';
  userTypeFilter: string = 'ALL';
  
  isLoading: boolean = false; // Dodato
  isProcessing: boolean = false;

  constructor(private taxService: TaxService) {}
  
  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.taxService.getTaxDebtors().subscribe({
      next: (response: any) => {
        // Backend vraća Page objekat, podaci su u 'content'
        this.users = response.content || []; 
        this.filterData();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju:', err);
        this.isLoading = false;
        // Opciono: ovde možeš dodati mock podatke ako je backend i dalje u kvaru
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
          alert('Obračun poreza je uspešno pokrenut i naplaćen.');
          this.loadData(); 
          this.isProcessing = false;
        },
        error: (err: any) => {
          console.error('Greška pri obračunu:', err);
          this.isProcessing = false;
        }
      });
    
  }
}