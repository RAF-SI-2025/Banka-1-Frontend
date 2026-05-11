import { Component, OnInit } from '@angular/core';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FundService } from '../../../orders/services/fund.service';
import { Fund } from '../../../orders/models/fund.model';

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

  showSupervisorWarning = false;
  fundsToTransfer: Fund[] = [];
  isFundsLoading = false;
  private pendingEmployeeUpdate: Employee | null = null;

  private searchTimeout: any;

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private toastService: ToastService,
    private fundService: FundService
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

    const isSupervisorDowngrade =
      this.selectedEmployeeForEdit?.role === 'SUPERVISOR' &&
      updatedEmployee.role !== 'SUPERVISOR';

    if (isSupervisorDowngrade) {
      this.isFundsLoading = true;
      this.pendingEmployeeUpdate = updatedEmployee;
      this.closeEditModal();

      this.fundService.getFundsBySupervisorId(updatedEmployee.id).subscribe({
        next: funds => {
          this.isFundsLoading = false;
          if (funds.length > 0) {
            this.fundsToTransfer = funds;
            this.showSupervisorWarning = true;
          } else {
            this.doUpdateEmployee(updatedEmployee);
          }
        },
        error: () => {
          this.isFundsLoading = false;
          this.doUpdateEmployee(updatedEmployee);
        }
      });
      return;
    }

    this.doUpdateEmployee(updatedEmployee);
  }

  private doUpdateEmployee(employee: Employee): void {
    if (!employee.id) return;

    this.employeeService.updateEmployee(employee.id, employee).subscribe({
      next: () => {
        this.toastService.success('Employee updated successfully.');
        this.loadEmployees();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update employee.');
      }
    });
  }

  confirmSupervisorDowngrade(): void {
    const pending = this.pendingEmployeeUpdate;
    if (!pending?.id) return;

    const adminId = this.authService.getUserIdFromToken();
    if (!adminId) {
      this.toastService.error('Nije moguće identifikovati admina.');
      return;
    }

    this.fundService.transferFundOwnership(pending.id, adminId).subscribe({
      next: () => {
        this.showSupervisorWarning = false;
        this.fundsToTransfer = [];
        this.pendingEmployeeUpdate = null;
        this.doUpdateEmployee(pending);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Greška pri prenosu fondova.');
      }
    });
  }

  cancelSupervisorDowngrade(): void {
    this.showSupervisorWarning = false;
    this.fundsToTransfer = [];
    this.pendingEmployeeUpdate = null;
  }

  onLogout(): void {
    this.authService.logout();
  }

  onHome(): void {
    this.authService.navigateToHome();
  }
}
