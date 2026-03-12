import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { EmployeeCreateComponent } from './employee-create.component';
import { EmployeeService } from '../../services/employee.service';

describe('EmployeeCreateComponent', () => {
  let component: EmployeeCreateComponent;
  let fixture: ComponentFixture<EmployeeCreateComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;

  beforeEach(() => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', ['createEmployee']);

    TestBed.configureTestingModule({
      declarations: [EmployeeCreateComponent],
      imports: [ReactiveFormsModule,  RouterTestingModule.withRoutes([
        { path: 'employees', component: {} as any }
      ])],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy }
      ]
    });

    fixture = TestBed.createComponent(EmployeeCreateComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── forma validacija ───────────────────────────────────────────────────────

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.employeeForm.invalid).toBeTrue();
    });

    it('should be valid with correct data', () => {
      component.employeeForm.patchValue({
        fullName: 'Petar Petrović',
        email: 'petar@test.com',
        role: 'Regular employee',
        status: 'Active'
      });
      expect(component.employeeForm.valid).toBeTrue();
    });

    it('should be invalid with short fullName', () => {
      component.employeeForm.patchValue({
        fullName: 'Pe',
        email: 'petar@test.com'
      });
      expect(component.employeeForm.get('fullName')?.invalid).toBeTrue();
    });

    it('should be invalid with wrong email format', () => {
      component.employeeForm.patchValue({
        fullName: 'Petar Petrović',
        email: 'not-an-email'
      });
      expect(component.employeeForm.get('email')?.invalid).toBeTrue();
    });
  });

  // ─── onSubmit ───────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('should not call service if form is invalid', () => {
      component.onSubmit();
      expect(employeeService.createEmployee).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched if form is invalid', () => {
      component.onSubmit();
      expect(component.employeeForm.get('fullName')?.touched).toBeTrue();
      expect(component.employeeForm.get('email')?.touched).toBeTrue();
    });

    it('should call createEmployee with correct payload', () => {
      employeeService.createEmployee.and.returnValue(of({} as any));
      component.employeeForm.patchValue({
        fullName: 'Petar Petrović',
        email: 'petar@test.com',
        role: 'Regular employee',
        status: 'Active'
      });

      component.onSubmit();

      expect(employeeService.createEmployee).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          ime: 'Petar',
          prezime: 'Petrović',
          email: 'petar@test.com'
        })
      );
    });

    it('should log error if createEmployee fails', () => {
      spyOn(console, 'error');
      employeeService.createEmployee.and.returnValue(throwError(() => new Error('error')));
      component.employeeForm.patchValue({
        fullName: 'Petar Petrović',
        email: 'petar@test.com',
        role: 'Regular employee',
        status: 'Active'
      });

      component.onSubmit();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── mapPermissions ─────────────────────────────────────────────────────────

  describe('mapPermissions', () => {
    it('should return empty array when no permissions selected', () => {
      component.employeeForm.patchValue({
        permCreate: false,
        permEdit: false,
        permDelete: false,
        permView: false
      });
      const result = (component as any).mapPermissions(component.employeeForm.value);
      expect(result).toEqual([]);
    });

    it('should return correct permissions when selected', () => {
      component.employeeForm.patchValue({
        permCreate: true,
        permEdit: true,
        permDelete: false,
        permView: false
      });
      const result = (component as any).mapPermissions(component.employeeForm.value);
      expect(result).toEqual(['CREATE', 'EDIT']);
    });
  });
});
