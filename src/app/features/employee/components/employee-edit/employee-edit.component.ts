import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../../models/employee';

/**
 * Komponenta modalnog prozora za izmenu podataka o zaposlenom.
 * Koristi reaktivne forme (Reactive Forms) za validaciju i upravljanje stanjem podataka.
 * Implementira OnChanges interfejs za sinhronizaciju forme sa ulaznim podacima.
 */
@Component({
  selector: 'app-employee-edit-modal',
  templateUrl: './employee-edit.component.html',
  styleUrls: ['./employee-edit.component.css']
})
export class EmployeeEditComponent implements OnChanges {
  /** Originalni objekat zaposlenog koji se menja, prosleđen iz roditeljske komponente. */
  @Input() employee!: Employee;

  /** Događaj koji se emituje kada korisnik uspešno sačuva izmene. Šalje ažurirani objekat. */
  @Output() save = new EventEmitter<Employee>();

  /** Događaj koji se emituje kada korisnik odustane od izmena i zatvori modal. */
  @Output() cancel = new EventEmitter<void>();

  /** Reaktivna forma koja upravlja poljima za izmenu. */
  editForm: FormGroup;

  /**
   * Konstruktor komponente. Inicijalizuje reaktivnu formu sa definisanim pravilima validacije.
   * @param fb Servis za lakšu izgradnju reaktivnih formi.
   */
  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      ime: ['', [Validators.required, Validators.minLength(2)]],
      prezime: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      pozicija: ['Regular employee'],
      aktivan: [true],
      permisije: [[]]
    });
  }

  /**
   * Životni ciklus koji detektuje promene na @Input poljima.
   * Kada se prosledi novi 'employee', forma se automatski popunjava njegovim podacima (patching).
   * @param changes Objekat koji sadrži trenutne i prethodne vrednosti ulaznih parametara.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.editForm.patchValue({
        ime: this.employee.ime || '',
        prezime: this.employee.prezime || '',
        email: this.employee.email || '',
        pozicija: this.employee.pozicija || 'Regular employee',
        aktivan: this.employee.aktivan !== false,
        permisije: this.employee.permisije ? [...this.employee.permisije] : []
      });
    }
  }

  /**
   * Upravlja stanjem niza permisija na osnovu interakcije sa checkbox elementima.
   * Dodaje ili uklanja permisiju iz kontrolnog polja forme.
   * @param permission Naziv permisije kojom se upravlja (npr. 'Create', 'Edit').
   * @param event DOM događaj promene stanja checkbox-a.
   */
  togglePermission(permission: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    let currentPermissions = this.editForm.get('permisije')?.value as string[];
    
    if (isChecked) {
      currentPermissions.push(permission);
    } else {
      currentPermissions = currentPermissions.filter((p: string) => p !== permission);
    }
    
    this.editForm.patchValue({ permisije: currentPermissions });
  }

  /**
   * Validira formu i emituje ažurirane podatke roditeljskoj komponenti.
   * Ukoliko je forma nevalidna, aktivira vizuelni prikaz grešaka na svim poljima.
   * Kombinuje originalne podatke (poput ID-ja) sa novim vrednostima iz forme.
   */
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

  /**
   * Prekida proces izmene i šalje signal za zatvaranje modala bez čuvanja podataka.
   */
  onCancel(): void {
    this.cancel.emit();
  }
}