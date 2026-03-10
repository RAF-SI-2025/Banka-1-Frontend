import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  // Pamtimo trenutno stanje sva tri filtera
  currentSearchTerm: string = '';
  currentStatusFilter: string = 'All';
  currentPermissionFilter: string = 'All';

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(data => {
      this.employees = data;
      this.filteredEmployees = data;
    });
  }

  // 1. Događaj kada se kuca u polje za pretragu
  onSearchInput(event: any): void {
    this.currentSearchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  // 2. Događaj kada se promeni Status padajući meni
  onStatusChange(event: any): void {
    this.currentStatusFilter = event.target.value;
    this.applyFilters();
  }

  // 3. Događaj kada se promeni Permissions padajući meni
  onPermissionChange(event: any): void {
    this.currentPermissionFilter = event.target.value;
    this.applyFilters();
  }

  // GLAVNA FUNKCIJA KOJA SPAJA SVE FILTERE
  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(emp => {
      
      // USLOV A: Poklapanje teksta (Ime, Prezime, Email)
      const matchesSearch = 
        emp.firstName.toLowerCase().includes(this.currentSearchTerm) || 
        emp.lastName.toLowerCase().includes(this.currentSearchTerm) ||
        emp.email.toLowerCase().includes(this.currentSearchTerm);

      // USLOV B: Poklapanje Statusa (Pretvaramo string iz HTML-a u boolean iz baze)
      let matchesStatus = true;
      if (this.currentStatusFilter === 'Active') {
        matchesStatus = emp.status === true;
      } else if (this.currentStatusFilter === 'Inactive') {
        matchesStatus = emp.status === false;
      }

      // USLOV C: Poklapanje Dozvola (Proveravamo da li niz dozvola sadrži izabranu)
      let matchesPermission = true;
      if (this.currentPermissionFilter !== 'All') {
        matchesPermission = emp.permissions.includes(this.currentPermissionFilter);
      }

      // Da bi zaposleni bio prikazan, mora da prođe SVA TRI uslova
      return matchesSearch && matchesStatus && matchesPermission;
    });
  }

  deleteEmployee(id: number): void {
    if (confirm('Da li ste sigurni da želite da obrišete ovog zaposlenog?')) {
      this.employeeService.deleteEmployee(id).subscribe(() => {
        // Kada obrišemo radnika iz glavne liste, ponovo pokrećemo filtere
        this.employees = this.employees.filter(e => e.id !== id);
        this.applyFilters(); 
      });
    }
  }

  trackById(index: number, employee: Employee): number {
    return employee.id;
  }
  selectedEmployeeForEdit: Employee | null = null;
  isEditModalOpen: boolean = false;

  /**
   * Otvara modal za izmenu i prosleđuje izabranog zaposlenog.
   * @param id ID zaposlenog koji se menja
   */
  editEmployee(id: number): void {
    const emp = this.employees.find(e => e.id === id);
    if (emp) {
      this.selectedEmployeeForEdit = emp;
      this.isEditModalOpen = true;
    }
  }

  /**
   * Zatvara modal.
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedEmployeeForEdit = null;
  }

  /**
   * Ažurira listu sa novim podacima sačuvanim u modalu.
   * @param updatedEmployee Ažurirani objekat zaposlenog
   */
  onEmployeeSaved(updatedEmployee: Employee): void {
    // TODO: Ovde pozvati servis za backend (this.employeeService.update(...))

    const index = this.employees.findIndex(e => e.id === updatedEmployee.id);
    if (index !== -1) {
      this.employees[index] = updatedEmployee;
      this.applyFilters(); // Obezbeđuje da se tabela odmah osveži
    }
    this.closeEditModal();
  }
  onLogout(): void {
    this.authService.logout();
  }


}
