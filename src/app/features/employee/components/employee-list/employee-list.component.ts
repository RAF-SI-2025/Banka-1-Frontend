import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Komponenta koja upravlja prikazom i logikom liste zaposlenih.
 * Omogućava pregled, filtriranje, pretragu, brisanje i pokretanje procesa izmene zaposlenih.
 */
@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  /** Originalna lista svih zaposlenih preuzeta sa servera. */
  employees: Employee[] = [];
  
  /** Lista zaposlenih koja se prikazuje u tabeli nakon primene filtera. */
  filteredEmployees: Employee[] = [];

  /** Trenutni termin za pretragu unet u tekstualno polje. */
  currentSearchTerm: string = '';
  
  /** Trenutno izabrani status za filtriranje (All, Active, Inactive). */
  currentStatusFilter: string = 'All';
  
  /** Trenutno izabrana permisija za filtriranje liste. */
  currentPermissionFilter: string = 'All';

  /** Objekat zaposlenog koji je izabran za izmenu u modalnom prozoru. */
  selectedEmployeeForEdit: Employee | null = null;
  
  /** Indikator vidljivosti modalnog prozora za izmenu podataka. */
  isEditModalOpen: boolean = false;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  /**
   * Inicijalizacioni životni ciklus komponente. 
   * Pokreće početno učitavanje podataka o zaposlenima.
   */
  ngOnInit(): void {
    this.loadEmployees();
  }

  /**
   * Poziva servis za dobavljanje svih zaposlenih sa backend-a.
   * Podržava standardnu paginaciju mapiranjem 'content' polja iz odgovora.
   */
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employees = data.content || data;
        this.filteredEmployees = this.employees;
      },
      error: (err) => console.error('Greška pri učitavanju zaposlenih:', err)
    });
  }

  /**
   * Obrađuje unos u polje za pretragu i osvežava prikazanu listu.
   * @param event DOM događaj unosa teksta.
   */
  onSearchInput(event: any): void {
    this.currentSearchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  /**
   * Obrađuje promenu statusa u padajućem meniju.
   * @param event DOM događaj promene vrednosti select elementa.
   */
  onStatusChange(event: any): void {
    this.currentStatusFilter = event.target.value;
    this.applyFilters();
  }

  /**
   * Obrađuje promenu izabrane permisije u padajućem meniju.
   * @param event DOM događaj promene vrednosti select elementa.
   */
  onPermissionChange(event: any): void {
    this.currentPermissionFilter = event.target.value;
    this.applyFilters();
  }

  /**
   * Glavna logika za filtriranje liste zaposlenih.
   * Kombinuje tekstualnu pretragu (ime, prezime, email), status aktivnosti i niz permisija.
   */
  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(emp => {
      const matchesSearch = 
        (emp.ime?.toLowerCase().includes(this.currentSearchTerm) || false) || 
        (emp.prezime?.toLowerCase().includes(this.currentSearchTerm) || false) ||
        (emp.email?.toLowerCase().includes(this.currentSearchTerm) || false);

      let matchesStatus = true;
      if (this.currentStatusFilter === 'Active') matchesStatus = emp.aktivan === true;
      else if (this.currentStatusFilter === 'Inactive') matchesStatus = emp.aktivan === false;

      let matchesPermission = true;
      if (this.currentPermissionFilter !== 'All') {
        matchesPermission = emp.permisije ? emp.permisije.includes(this.currentPermissionFilter) : false;
      }

      return matchesSearch && matchesStatus && matchesPermission;
    });
  }

  /**
   * Pokreće proceduru brisanja zaposlenog nakon korisničke potvrde.
   * Vršili logičko brisanje na serveru i osvežava lokalni prikaz.
   * @param id Jedinstveni identifikator zaposlenog.
   */
  deleteEmployee(id: number | undefined): void {
    if (!id) return;
    if (confirm('Da li ste sigurni da želite da obrišete ovog zaposlenog?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.employees = this.employees.filter(e => e.id !== id);
          this.applyFilters(); 
        },
        error: (err) => console.error('Greška pri brisanju:', err)
      });
    }
  }

  /**
   * Pomaže Angular-u da optimizuje renderovanje liste u tabeli.
   * @param index Indeks u nizu.
   * @param employee Objekat zaposlenog.
   * @returns Jedinstveni ključ (id) za praćenje elementa.
   */
  trackById(index: number, employee: Employee): number {
    return employee.id || index;
  }

  /**
   * Otvara modalni prozor za izmenu podataka o zaposlenom.
   * @param id Jedinstveni identifikator zaposlenog koji se menja.
   */
  editEmployee(id: number | undefined): void {
    if (!id) return;
    const emp = this.employees.find(e => e.id === id);
    if (emp) {
      this.selectedEmployeeForEdit = emp;
      this.isEditModalOpen = true;
    }
  }

  /**
   * Zatvara modalni prozor i resetuje selektovanog zaposlenog.
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedEmployeeForEdit = null;
  }

  /**
   * Obrađuje sačuvane podatke iz modalnog prozora.
   * Šalje zahtev za izmenu na backend i ažurira lokalni niz podataka.
   * @param updatedEmployee Objekat zaposlenog sa novim vrednostima.
   */
  onEmployeeSaved(updatedEmployee: Employee): void {
    if (!updatedEmployee.id) return;

    this.employeeService.updateEmployee(updatedEmployee.id, updatedEmployee).subscribe({
      next: (response) => {
        const index = this.employees.findIndex(e => e.id === response.id);
        if (index !== -1) {
          this.employees[index] = response;
          this.applyFilters(); 
        }
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Greška pri izmeni zaposlenog:', err);
      }
    });
  }

  /**
   * Odjavljuje korisnika sa sistema i čisti sesiju preko AuthService-a.
   */
  onLogout(): void {
    this.authService.logout();
  }
}