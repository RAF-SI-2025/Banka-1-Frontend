import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../models/employee';

@Component({
  selector: 'app-employee-edit-modal',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.css']
})
export class EmployeeEditComponent implements OnChanges {
  @Input() employee!: Employee;
  @Output() save = new EventEmitter<Employee>();
  @Output() cancel = new EventEmitter<void>();

  editForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      ime: ['', [Validators.required, Validators.minLength(2)]],
      prezime: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      pozicija: [''],
      departman: [''],
      role: ['EmployeeBasic'],
      aktivan: [true],
      permisije: [[]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.editForm.patchValue({
        ime: this.employee.ime || '',
        prezime: this.employee.prezime || '',
        email: this.employee.email || '',
        pozicija: this.employee.pozicija || '',
        departman: this.employee.departman || '',
        role: this.employee.role || 'EmployeeBasic',
        aktivan: this.employee.aktivan !== false,
        permisije: this.employee.permisije ? [...this.employee.permisije] : []
      });
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const updatedEmployee: Employee = {
      ...this.employee,
      ...this.editForm.value
    };

    this.save.emit(updatedEmployee);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }
}
