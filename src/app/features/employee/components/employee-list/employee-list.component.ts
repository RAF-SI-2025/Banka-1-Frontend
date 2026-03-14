import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  isLoading = false;

  searchQuery = '';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  selectedEmployeeForEdit: Employee | null = null;
  isEditModalOpen = false;

  private searchTimeout: any;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;

    if (this.searchQuery.trim()) {
      this.employeeService.searchEmployees(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (data: any) => {
          this.employees = data.content || [];
          this.totalElements = data.totalElements || 0;
          this.totalPages = data.totalPages || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.error?.message || 'Failed to search employees.');
        }
      });
    } else {
      this.employeeService.getEmployees(this.currentPage, this.pageSize).subscribe({
        next: (data: any) => {
          this.employees = data.content || [];
          this.totalElements = data.totalElements || 0;
          this.totalPages = data.totalPages || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error(err.error?.message || 'Failed to load employees.');
        }
      });
    }
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadEmployees();
    }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadEmployees();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadEmployees();
  }

  getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  deleteEmployee(id: number | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.toastService.success('Employee deactivated successfully.');
          this.loadEmployees();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to deactivate employee.');
        }
      });
    }
  }

  trackById(index: number, employee: Employee): number {
    return employee.id || index;
  }

  editEmployee(id: number | undefined): void {
    if (!id) return;
    const emp = this.employees.find(e => e.id === id);
    if (emp) {
      this.selectedEmployeeForEdit = emp;
      this.isEditModalOpen = true;
    }
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedEmployeeForEdit = null;
  }

  onEmployeeSaved(updatedEmployee: Employee): void {
    if (!updatedEmployee.id) return;

    this.employeeService.updateEmployee(updatedEmployee.id, updatedEmployee).subscribe({
      next: () => {
        this.toastService.success('Employee updated successfully.');
        this.closeEditModal();
        this.loadEmployees();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update employee.');
      }
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
