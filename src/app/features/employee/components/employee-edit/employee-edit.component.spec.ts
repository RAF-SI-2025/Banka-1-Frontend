import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { EmployeeEditComponent } from './employee-edit.component';
import { Employee } from '../../models/employee';

// PR_31 phase 1: spec rewritten to match current EmployeeEditComponent
// (no togglePermission/email/permisije in editForm — only ime/prezime/brojTelefona/
// adresa/pozicija/departman/role/aktivan/margin).
describe('EmployeeEditComponent', () => {
  let component: EmployeeEditComponent;
  let fixture: ComponentFixture<EmployeeEditComponent>;

  const mockEmployee: Employee = {
    id: 1,
    ime: 'Petar',
    prezime: 'Petrović',
    email: 'petar@test.com',
    datumRodjenja: '1990-01-01',
    pol: 'M',
    brojTelefona: '+381601234567',
    pozicija: 'Developer',
    role: 'EMPLOYEE',
    aktivan: true,
    permisije: ['CREATE', 'EDIT'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeEditComponent],
      imports: [ReactiveFormsModule],
    });
    fixture = TestBed.createComponent(EmployeeEditComponent);
    component = fixture.componentInstance;
    component.employee = mockEmployee;
    component.ngOnChanges({
      employee: {
        currentValue: mockEmployee,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should patch form with employee data', () => {
      expect(component.editForm.get('ime')?.value).toBe('Petar');
      expect(component.editForm.get('prezime')?.value).toBe('Petrović');
      expect(component.editForm.get('brojTelefona')?.value).toBe('+381601234567');
      expect(component.editForm.get('pozicija')?.value).toBe('Developer');
      expect(component.editForm.get('role')?.value).toBe('EMPLOYEE');
      expect(component.editForm.get('aktivan')?.value).toBeTrue();
    });
  });

  describe('onSave', () => {
    it('should emit save event with updated employee', () => {
      const saveSpy = spyOn(component.save, 'emit');

      component.editForm.patchValue({
        ime: 'Nikola',
        prezime: 'Petrović',
        brojTelefona: '+381601234567',
      });
      component.onSave();

      expect(saveSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ ime: 'Nikola', id: 1 }),
      );
    });

    it('should not emit if form is invalid', () => {
      const saveSpy = spyOn(component.save, 'emit');

      // ime has minLength(2) — single char invalidates the form.
      component.editForm.patchValue({ ime: 'X' });
      component.onSave();

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
