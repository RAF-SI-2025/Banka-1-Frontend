import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { AccountCreateComponent } from './account-create.component';
import { ClientService } from '../../services/client.service';

describe('AccountCreateComponent', () => {
  let component: AccountCreateComponent;
  let fixture: ComponentFixture<AccountCreateComponent>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;

  beforeEach(async () => {
    clientServiceSpy = jasmine.createSpyObj('ClientService', ['getAllClients']);
    clientServiceSpy.getAllClients.and.returnValue(of([
      { id: '1', firstName: 'Pera', lastName: 'Perić' }
    ]));

    await TestBed.configureTestingModule({
      declarations: [AccountCreateComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: ClientService, useValue: clientServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    if (!component) {
      throw new Error('Component should be created');
    }
  });

  it('form should be invalid when empty', () => {
    if (component.form.valid) {
      throw new Error('Form should be invalid when empty');
    }
  });

  it('should move to step 2 when step1 is valid', () => {
    // set required fields for TEKUCI
    component.form.get('kind')?.setValue('TEKUCI');
    component.form.get('subtype')?.setValue('standardni');

    component.next();

    if (component.step !== 2) {
      throw new Error('Component should move to step 2 when first step is valid');
    }
  });

  it('should require company fields when owner is business (TEKUCI business subtype)', () => {
    // Set TEKUCI + business subtype
    component.form.get('kind')?.setValue('TEKUCI');
    component.form.get('subtype')?.setValue('DOO');
    fixture.detectChanges();

    // move to step 2
    component.next();
    if (component.step !== 2) {
      throw new Error('Should be on step 2');
    }

    const companyName = component.form.get('companyName');
    const companyNumber = component.form.get('companyNumber');

    // empty values should be invalid (required)
    companyName?.setValue('');
    companyName?.markAsTouched();
    companyNumber?.setValue('');
    companyNumber?.markAsTouched();
    fixture.detectChanges();

    if (!companyName?.invalid) {
      throw new Error('companyName should be invalid when empty for business owner');
    }

    // fill one required field and check validity
    companyName?.setValue('ACME d.o.o.');
    fixture.detectChanges();
    if (companyName?.invalid) {
      throw new Error('companyName should be valid after setting a value');
    }
  });

  it('should require company fields when owner is business (DEVIZNI with business owner)', () => {
    // Set DEVIZNI and owner type business
    component.form.get('kind')?.setValue('DEVIZNI');
    component.form.get('currency')?.setValue('USD');
    component.form.get('currencyOwnerType')?.setValue('business');
    fixture.detectChanges();

    // move to step 2 (owner selection required - set owner)
    component.form.get('ownerId')?.setValue('1');
    component.next();
    if (component.step !== 2) {
      throw new Error('Should be on step 2');
    }

    const companyTaxId = component.form.get('companyTaxId');
    companyTaxId?.setValue('');
    companyTaxId?.markAsTouched();
    fixture.detectChanges();

    if (!companyTaxId?.invalid) {
      throw new Error('companyTaxId should be invalid when empty for business owner');
    }

    companyTaxId?.setValue('123456789');
    fixture.detectChanges();
    if (companyTaxId?.invalid) {
      throw new Error('companyTaxId should be valid after setting a value');
    }
  });
});