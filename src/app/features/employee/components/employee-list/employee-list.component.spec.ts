import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { EmployeeListComponent } from './employee-list.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Employee } from '../../models/employee';

const mockEmployees: Employee[] = [
  {
    id: 1,
    ime: 'Petar',
    prezime: 'Petrović',
    email: 'petar@test.com',
    datumRodjenja: '1990-01-01',
    pol: 'M',
    brojTelefona: '+381601234567',
    aktivan: true,
    permisije: ['CREATE', 'EDIT']
  },
  {
    id: 2,
    ime: 'Ana',
    prezime: 'Anić',
    email: 'ana@test.com',
    datumRodjenja: '1995-05-05',
    pol: 'Z',
    brojTelefona: '+381607654321',
    aktivan: false,
    permisije: ['VIEW']
  }
];

describe('EmployeeListComponent', () => {
  let component: EmployeeListComponent;
  let fixture: ComponentFixture<EmployeeListComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', [
      'getEmployees', 'deleteEmployee', 'updateEmployee'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['logout']);

    employeeSpy.getEmployees.and.returnValue(of({ content: mockEmployees }));

    TestBed.configureTestingModule({
      declarations: [EmployeeListComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    fixture = TestBed.createComponent(EmployeeListComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── loadEmployees ──────────────────────────────────────────────────────────

  describe('loadEmployees', () => {
    it('should load employees on init', () => {
      expect(component.employees.length).toBe(2);
      expect(component.filteredEmployees.length).toBe(2);
    });

    it('should handle flat array response', () => {
      employeeService.getEmployees.and.returnValue(of(mockEmployees));
      component.loadEmployees();
      expect(component.employees.length).toBe(2);
    });

    it('should log error if loading fails', () => {
      spyOn(console, 'error');
      employeeService.getEmployees.and.returnValue(throwError(() => new Error('Network error')));
      component.loadEmployees();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── applyFilters ───────────────────────────────────────────────────────────

  describe('applyFilters', () => {
    it('should filter by search term', () => {
      component.currentSearchTerm = 'petar';
      component.applyFilters();
      expect(component.filteredEmployees.length).toBe(1);
      expect(component.filteredEmployees[0].ime).toBe('Petar');
    });

    it('should filter by active status', () => {
      component.currentStatusFilter = 'Active';
      component.applyFilters();
      expect(component.filteredEmployees.length).toBe(1);
      expect(component.filteredEmployees[0].aktivan).toBeTrue();
    });

    it('should filter by inactive status', () => {
      component.currentStatusFilter = 'Inactive';
      component.applyFilters();
      expect(component.filteredEmployees.length).toBe(1);
      expect(component.filteredEmployees[0].aktivan).toBeFalse();
    });

    it('should filter by permission', () => {
      component.currentPermissionFilter = 'VIEW';
      component.applyFilters();
      expect(component.filteredEmployees.length).toBe(1);
      expect(component.filteredEmployees[0].ime).toBe('Ana');
    });

    it('should show all when filters are default', () => {
      component.currentSearchTerm = '';
      component.currentStatusFilter = 'All';
      component.currentPermissionFilter = 'All';
      component.applyFilters();
      expect(component.filteredEmployees.length).toBe(2);
    });
  });

  // ─── deleteEmployee ─────────────────────────────────────────────────────────

  describe('deleteEmployee', () => {
    it('should not delete if id is undefined', () => {
      component.deleteEmployee(undefined);
      expect(employeeService.deleteEmployee).not.toHaveBeenCalled();
    });

    it('should delete employee and update list', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      employeeService.deleteEmployee.and.returnValue(of(void 0));
      component.deleteEmployee(1);
      expect(component.employees.find(e => e.id === 1)).toBeUndefined();
    });

    it('should not delete if user cancels confirm', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteEmployee(1);
      expect(employeeService.deleteEmployee).not.toHaveBeenCalled();
    });
  });

  // ─── editEmployee ───────────────────────────────────────────────────────────

  describe('editEmployee', () => {
    it('should open edit modal with correct employee', () => {
      component.editEmployee(1);
      expect(component.isEditModalOpen).toBeTrue();
      expect(component.selectedEmployeeForEdit?.id).toBe(1);
    });

    it('should not open modal if id not found', () => {
      component.editEmployee(999);
      expect(component.isEditModalOpen).toBeFalse();
    });
  });

  // ─── closeEditModal ─────────────────────────────────────────────────────────

  describe('closeEditModal', () => {
    it('should close modal and clear selected employee', () => {
      component.isEditModalOpen = true;
      component.selectedEmployeeForEdit = mockEmployees[0];
      component.closeEditModal();
      expect(component.isEditModalOpen).toBeFalse();
      expect(component.selectedEmployeeForEdit).toBeNull();
    });
  });

  // ─── onLogout ───────────────────────────────────────────────────────────────

  describe('onLogout', () => {
    it('should call authService logout', () => {
      component.onLogout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
