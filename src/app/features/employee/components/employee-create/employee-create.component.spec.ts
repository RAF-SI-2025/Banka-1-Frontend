import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { EmployeeCreateComponent } from './employee-create.component';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../../../shared/services/toast.service';

// PR_31 follow-up: kompletan rewrite spec-a — komponenta vise nema fullName/status/permCreate*,
// koristi nove polja (ime/prezime/pozicija/departman/role) i ToastService umesto console.error-a.
describe('EmployeeCreateComponent', () => {
  let component: EmployeeCreateComponent;
  let fixture: ComponentFixture<EmployeeCreateComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    const employeeSpy = jasmine.createSpyObj('EmployeeService', ['createEmployee']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    TestBed.configureTestingModule({
      declarations: [EmployeeCreateComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([{ path: 'employees', component: {} as any }])
      ],
      providers: [
        { provide: EmployeeService, useValue: employeeSpy },
        { provide: ToastService, useValue: toastSpy }
      ]
    });

    fixture = TestBed.createComponent(EmployeeCreateComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.employeeForm.invalid).toBeTrue();
    });

    it('should be valid with correct data', () => {
      component.employeeForm.patchValue({
        ime: 'Petar',
        prezime: 'Petrović',
        email: 'petar@test.com',
        brojTelefona: '+381601234567',
        pozicija: 'Backend',
        departman: 'IT',
        role: 'EMPLOYEE'
      });
      expect(component.employeeForm.valid).toBeTrue();
    });

    it('should be invalid with short ime', () => {
      component.employeeForm.patchValue({
        ime: 'P',
        prezime: 'Petrović',
        email: 'petar@test.com'
      });
      expect(component.employeeForm.get('ime')?.invalid).toBeTrue();
    });

    it('should be invalid with wrong email format', () => {
      component.employeeForm.patchValue({
        ime: 'Petar',
        prezime: 'Petrović',
        email: 'not-an-email'
      });
      expect(component.employeeForm.get('email')?.invalid).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should not call service if form is invalid', () => {
      component.onSubmit();
      expect(employeeService.createEmployee).not.toHaveBeenCalled();
    });

    it('should warn user if form is invalid', () => {
      component.onSubmit();
      expect(toastService.warning).toHaveBeenCalled();
    });

    it('should mark all fields as touched if form is invalid', () => {
      component.onSubmit();
      expect(component.employeeForm.get('ime')?.touched).toBeTrue();
      expect(component.employeeForm.get('email')?.touched).toBeTrue();
    });

    it('should call createEmployee with derived payload (username from email)', () => {
      employeeService.createEmployee.and.returnValue(of({} as any));
      component.employeeForm.patchValue({
        ime: 'Petar',
        prezime: 'Petrović',
        email: 'petar@test.com',
        brojTelefona: '+381601234567',
        pozicija: 'Backend',
        departman: 'IT',
        role: 'EMPLOYEE'
      });

      component.onSubmit();

      expect(employeeService.createEmployee).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          ime: 'Petar',
          prezime: 'Petrović',
          email: 'petar@test.com',
          username: 'petar'
        })
      );
    });

    it('should call toast error if createEmployee fails', () => {
      employeeService.createEmployee.and.returnValue(throwError(() => ({ error: { message: 'boom' } })));
      component.employeeForm.patchValue({
        ime: 'Petar',
        prezime: 'Petrović',
        email: 'petar@test.com',
        brojTelefona: '+381601234567',
        pozicija: 'Backend',
        departman: 'IT',
        role: 'EMPLOYEE'
      });

      component.onSubmit();
      expect(toastService.error).toHaveBeenCalled();
    });
  });
});
