import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { EmployeeEditComponent } from './employee-edit.component';
import { Employee } from '../../models/employee';

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
    aktivan: true,
    permisije: ['CREATE', 'EDIT']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeEditComponent],
      imports: [ReactiveFormsModule]
    });
    fixture = TestBed.createComponent(EmployeeEditComponent);
    component = fixture.componentInstance;
    component.employee = mockEmployee;
    component.ngOnChanges({
      employee: {
        currentValue: mockEmployee,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── ngOnChanges ────────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should patch form with employee data', () => {
      expect(component.editForm.get('ime')?.value).toBe('Petar');
      expect(component.editForm.get('prezime')?.value).toBe('Petrović');
      expect(component.editForm.get('email')?.value).toBe('petar@test.com');
      expect(component.editForm.get('aktivan')?.value).toBeTrue();
    });

    it('should copy permissions array without mutating original', () => {
      const formPermissions = component.editForm.get('permisije')?.value;
      expect(formPermissions).toEqual(['CREATE', 'EDIT']);
      expect(formPermissions).not.toBe(mockEmployee.permisije);
    });
  });

  // ─── togglePermission ───────────────────────────────────────────────────────

  describe('togglePermission', () => {
    it('should add permission when checkbox is checked', () => {
      const event = { target: { checked: true } } as any;
      component.togglePermission('DELETE', event);
      expect(component.editForm.get('permisije')?.value).toContain('DELETE');
    });

    it('should remove permission when checkbox is unchecked', () => {
      const event = { target: { checked: false } } as any;
      component.togglePermission('CREATE', event);
      expect(component.editForm.get('permisije')?.value).not.toContain('CREATE');
    });
  });

  // ─── onSave ─────────────────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should emit save event with updated employee', () => {
      const saveSpy = spyOn(component.save, 'emit');

      component.editForm.patchValue({
        ime: 'Nikola',
        prezime: 'Petrović',
        email: 'petar@test.com'
      });
      component.onSave();

      expect(saveSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ ime: 'Nikola', id: 1 })
      );
    });

    it('should not emit if form is invalid', () => {
      const saveSpy = spyOn(component.save, 'emit');

      component.editForm.patchValue({ email: 'invalid-email' });
      component.onSave();

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  // ─── onCancel ───────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
