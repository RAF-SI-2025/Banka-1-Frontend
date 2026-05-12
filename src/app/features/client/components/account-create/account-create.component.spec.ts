import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { AccountCreateComponent } from './account-create.component';
import { ClientService } from '../../services/client.service';
import { AccountService } from '../../services/account.service';

describe('AccountCreateComponent', () => {
  let component: AccountCreateComponent;
  let fixture: ComponentFixture<AccountCreateComponent>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    clientServiceSpy = jasmine.createSpyObj('ClientService', ['getAllClients']);
    clientServiceSpy.getAllClients.and.returnValue(of([
      { id: 1, ime: 'Pera', prezime: 'Perić' } as any
    ]));

    accountServiceSpy = jasmine.createSpyObj('AccountService', [
      'createCheckingAccount',
      'createFxAccount'
    ]);
    accountServiceSpy.createCheckingAccount.and.returnValue(of({} as any));
    accountServiceSpy.createFxAccount.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      // PR_31 follow-up: AccountCreateComponent je standalone — mora ici u imports, ne u declarations.
      imports: [
        AccountCreateComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ClientService, useValue: clientServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy }
      ]
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

  it('should move to step 2 when step1 is valid (CHECKING + standardni subtype)', () => {
    // PR_31 follow-up: AccountKind enum vrednosti su 'CHECKING'/'FX' (ne 'TEKUCI'/'DEVIZNI').
    component.form.get('kind')?.setValue('CHECKING');
    component.form.get('subtype')?.setValue('standardni');
    fixture.detectChanges();

    component.next();

    if (component.step !== 2) {
      throw new Error('Component should move to step 2 when first step is valid');
    }
  });

  it('should require company fields when owner is business (CHECKING + DOO subtype)', () => {
    component.form.get('kind')?.setValue('CHECKING');
    component.form.get('subtype')?.setValue('DOO');
    fixture.detectChanges();

    // Move to step 2
    component.next();
    if (component.step !== 2) {
      throw new Error('Should be on step 2');
    }

    const companyName = component.form.get('companyName');
    const companyNumber = component.form.get('companyNumber');

    // Empty values should be invalid (required) for business owner.
    companyName?.setValue('');
    companyName?.markAsTouched();
    companyNumber?.setValue('');
    companyNumber?.markAsTouched();
    fixture.detectChanges();

    if (!companyName?.invalid) {
      throw new Error('companyName should be invalid when empty for business owner');
    }

    // Fill required field and check validity.
    companyName?.setValue('ACME d.o.o.');
    fixture.detectChanges();
    if (companyName?.invalid) {
      throw new Error('companyName should be valid after setting a value');
    }
  });

  it('should require company fields when owner is business (FX with BUSINESS owner type)', () => {
    // PR_31 follow-up: FX (devizni) + AccountOwnerType.BUSINESS aktivira poslovne validatore.
    component.form.get('kind')?.setValue('FX');
    component.form.get('currency')?.setValue('USD');
    component.form.get('currencyOwnerType')?.setValue('BUSINESS');
    fixture.detectChanges();

    component.form.get('ownerId')?.setValue('1');
    component.next();
    if (component.step !== 2) {
      throw new Error('Should be on step 2');
    }

    const companyName = component.form.get('companyName');
    companyName?.setValue('');
    companyName?.markAsTouched();
    fixture.detectChanges();

    if (!companyName?.invalid) {
      throw new Error('companyName should be invalid when empty for business owner');
    }
  });
});
