import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EmployeeListComponent } from './employee-list.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Employee } from '../../models/employee';

// PR_31 phase 1: spec rewritten to match current server-paginated component
// (no client-side filteredEmployees/applyFilters/currentSearchTerm).
const mockEmployees: Employee[] = [
  {
    id: 1,
    ime: 'Petar',
    prezime: 'Petrović',
    email: 'petar@test.com',
    datumRodjenja: '1990-01-01',
    pol: 'M',
    brojTelefona: '+381601234567',
    role: 'EMPLOYEE',
    aktivan: true,
    permisije: ['CREATE', 'EDIT'],
  },
  {
    id: 2,
    ime: 'Ana',
    prezime: 'Anić',
    email: 'ana@test.com',
    datumRodjenja: '1995-05-05',
    pol: 'Z',
    brojTelefona: '+381607654321',
    role: 'EMPLOYEE',
    aktivan: false,
    permisije: ['VIEW'],
  },
];

describe('EmployeeListComponent', () => {
  let component: EmployeeListComponent;
  let fixture: ComponentFixture<EmployeeListComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', [
      'getEmployees',
      'searchEmployees',
      'deleteEmployee',
      'updateEmployee',
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['logout', 'navigateToHome']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    employeeSpy.getEmployees.and.returnValue(
      of({ content: mockEmployees, totalElements: 2, totalPages: 1 }),
    );
    employeeSpy.searchEmployees.and.returnValue(
      of({ content: [mockEmployees[0]], totalElements: 1, totalPages: 1 }),
    );

    TestBed.configureTestingModule({
      declarations: [EmployeeListComponent],
      // PR_31 follow-up: template koristi [(ngModel)] za search input — treba FormsModule.
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
      // Template uses <app-navbar /> which lives in a standalone import graph
      // we don't bring in for this unit test — schema lets the renderer ignore it.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    fixture = TestBed.createComponent(EmployeeListComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadEmployees', () => {
    it('should load employees on init', () => {
      expect(component.employees.length).toBe(2);
      expect(component.totalElements).toBe(2);
    });

    it('should log error if loading fails', () => {
      employeeService.getEmployees.and.returnValue(throwError(() => new Error('Network error')));
      component.loadEmployees();
      expect(toastService.error).toHaveBeenCalled();
    });
  });

  describe('deleteEmployee', () => {
    it('should not delete if id is undefined', () => {
      component.deleteEmployee(undefined);
      expect(employeeService.deleteEmployee).not.toHaveBeenCalled();
    });

    it('should delete employee and reload when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      employeeService.deleteEmployee.and.returnValue(of(void 0));
      const loadSpy = spyOn(component, 'loadEmployees');
      component.deleteEmployee(1);
      expect(employeeService.deleteEmployee).toHaveBeenCalledWith(1);
      expect(loadSpy).toHaveBeenCalled();
    });

    it('should not delete if user cancels confirm', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteEmployee(1);
      expect(employeeService.deleteEmployee).not.toHaveBeenCalled();
    });
  });

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

  describe('closeEditModal', () => {
    it('should close modal and clear selected employee', () => {
      component.isEditModalOpen = true;
      component.selectedEmployeeForEdit = mockEmployees[0];
      component.closeEditModal();
      expect(component.isEditModalOpen).toBeFalse();
      expect(component.selectedEmployeeForEdit).toBeNull();
    });
  });

  describe('onLogout', () => {
    it('should call authService logout', () => {
      component.onLogout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
