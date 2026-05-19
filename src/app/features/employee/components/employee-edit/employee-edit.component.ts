import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../models/employee';
import {
  emailFormatValidator,
  notFutureDateValidator,
  phoneNumberValidator,
} from '../../../../shared/utils/validators';

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
      email: ['', [Validators.required, emailFormatValidator]],
      brojTelefona: ['', [Validators.required, phoneNumberValidator]],
      datumRodjenja: ['', [Validators.required, notFutureDateValidator]],
      pol: ['M', Validators.required],
      adresa: [''],
      pozicija: [''],
      departman: [''],
      role: ['BASIC'],
      aktivan: [true],
      margin: [false]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.editForm.patchValue({
        ime: this.employee.ime || '',
        prezime: this.employee.prezime || '',
        email: this.employee.email || '',
        brojTelefona: this.employee.brojTelefona || '',
        datumRodjenja: this.employee.datumRodjenja || '',
        pol: this.employee.pol || 'M',
        adresa: this.employee.adresa || '',
        pozicija: this.employee.pozicija || '',
        departman: this.employee.departman || '',
        role: this.employee.role || 'BASIC',
        aktivan: this.employee.aktivan !== false,
        margin: this.employee.margin === true
      });
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const updatedEmployee: Employee = {
      ...this.editForm.value,
      id: this.employee.id
    };

    this.save.emit(updatedEmployee);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('z-overlay') || (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }
}
