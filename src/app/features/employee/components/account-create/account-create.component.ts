import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientService, ClientDto } from '../../services/client.service';
import { AccountService } from '../../services/account.service';

/**
 * Tip računa.
 */
enum AccountKind {
  TEKUCI = 'TEKUCI',
  DEVIZNI = 'DEVIZNI'
}

/**
 * Tip vlasništva za devizni račun.
 */
enum AccountOwnerType {
  PERSONAL = 'personal',
  BUSINESS = 'business'
}

/**
 * Klijent prikazan u dropdown-u.
 */
interface ClientOption {
  id: string;
  name: string;
}

/**
 * Opcija za select polje.
 */
interface SelectOption<T> {
  value: T;
  label: string;
}

/**
 * Podaci o firmi za poslovni račun.
 */
interface CompanyPayload {
  name: string;
  registrationNumber: string;
  taxId: string;
  activityCode: string;
  address: string;
}

/**
 * Payload za kreiranje računa.
 */
interface AccountCreatePayload {
  kind: AccountKind;
  subtype: string | null;
  currency: string | null;
  ownerType: AccountOwnerType;
  ownerId: string;
  createCard: boolean;
  initialBalance: number;
  company?: CompanyPayload;
}

/**
 * State pri povratku sa forme za kreiranje klijenta.
 */
interface CreateClientNavigationState {
  createdClientId?: string;
  createdClientName?: string;
}

@Component({
  selector: 'app-account-create',
  templateUrl: './account-create.component.html',
  styleUrls: ['./account-create.component.scss']
})
export class AccountCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public form!: FormGroup;
  public step = 1;
  public submitted = false;

  public readonly accountKinds: SelectOption<AccountKind>[] = [
    { value: AccountKind.TEKUCI, label: 'Tekući' },
    { value: AccountKind.DEVIZNI, label: 'Devizni' }
  ];

  public readonly tekuciPersonal: string[] = [
    'standardni',
    'štedni',
    'penzionerski',
    'za mlade',
    'za studente',
    'za nezaposlene'
  ];

  public readonly tekuciBusiness: string[] = ['DOO', 'AD', 'fondacija'];

  public readonly currencies: string[] = ['EUR', 'CHF', 'USD', 'GBP', 'JPY', 'CAD', 'AUD'];

  public readonly ownerTypes: SelectOption<AccountOwnerType>[] = [
    { value: AccountOwnerType.PERSONAL, label: 'Lični' },
    { value: AccountOwnerType.BUSINESS, label: 'Poslovni' }
  ];

  public clients: ClientOption[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly clientService: ClientService,
    private readonly accountService: AccountService
  ) {}

  /**
   * Inicijalizuje reactive formu i pomoćnu logiku komponente.
    */
  public ngOnInit(): void {
    this.form = this.fb.group({
      kind: [null, Validators.required],
      subtype: [null],
      currency: [null],
      currencyOwnerType: [null],

      ownerId: [null, Validators.required],

      createCard: [false],
      initialBalance: [0, [Validators.required, Validators.min(0)]],

      companyName: [''],
      companyNumber: [''],
      companyTaxId: [''],
      companyActivityCode: [''],
      companyAddress: ['']
    });

    this.setupDynamicValidation();
    this.loadClients();
    this.patchCreatedClientFromState();
  }

  /**
   * Prelazi na sledeći korak forme ako je prvi korak validan.
   */
  public next(): void {
    const kindControl = this.form.get('kind');
    const subtypeControl = this.form.get('subtype');
    const currencyControl = this.form.get('currency');
    const currencyOwnerTypeControl = this.form.get('currencyOwnerType');

    kindControl?.markAsTouched();
    subtypeControl?.markAsTouched();
    currencyControl?.markAsTouched();
    currencyOwnerTypeControl?.markAsTouched();

    if (!kindControl?.valid) {
      return;
    }

    if (this.selectedKind === AccountKind.TEKUCI && !subtypeControl?.valid) {
      return;
    }

    if (
      this.selectedKind === AccountKind.DEVIZNI &&
      (!currencyControl?.valid || !currencyOwnerTypeControl?.valid)
    ) {
      return;
    }

    this.step = 2;
  }

  /**
   * Vraća korisnika na prethodni korak forme.
   */
  public prev(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  /**
   * Pokušava navigaciju ka formi za kreiranje novog klijenta.
   * Detalji toka povratka čekaju potvrdu mentora.
   */
  public openNewClient(): void {
    this.router.navigate(['/users/new'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  /**
   * Proverava da li trenutni izbor predstavlja poslovni račun.
   */
  public isBusiness(): boolean {
    if (this.selectedKind === AccountKind.TEKUCI) {
      return this.tekuciBusiness.includes(this.selectedSubtype ?? '');
    }

    if (this.selectedKind === AccountKind.DEVIZNI) {
      return this.selectedOwnerType === AccountOwnerType.BUSINESS;
    }

    return false;
  }

  /**
   * Obrađuje submit forme.
   * Trenutno samo formira i ispisuje payload.
   */
  public submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: AccountCreatePayload = {
      kind: this.selectedKind as AccountKind,
      subtype: this.selectedKind === AccountKind.TEKUCI ? this.selectedSubtype : null,
      currency: this.selectedKind === AccountKind.DEVIZNI ? this.selectedCurrency : null,
      ownerType:
        this.selectedKind === AccountKind.DEVIZNI
          ? (this.selectedOwnerType as AccountOwnerType)
          : this.isBusiness()
            ? AccountOwnerType.BUSINESS
            : AccountOwnerType.PERSONAL,
      ownerId: this.form.get('ownerId')?.value,
      createCard: this.form.get('createCard')?.value,
      initialBalance: this.form.get('initialBalance')?.value
    };

    if (this.isBusiness()) {
      payload.company = {
        name: this.form.get('companyName')?.value,
        registrationNumber: this.form.get('companyNumber')?.value,
        taxId: this.form.get('companyTaxId')?.value,
        activityCode: this.form.get('companyActivityCode')?.value,
        address: this.form.get('companyAddress')?.value
      };
    }

    // Call backend to create account and navigate back on success
    this.accountService.createAccount(payload).subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err: unknown) => {
        // Log error - UI error handling can be added later
        // eslint-disable-next-line no-console
        console.error('Failed to create account', err);
      }
    });
  }

  /**
   * Vraća da li je kontrola nevalidna i treba prikazati grešku.
   */
  public isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  /**
   * trackBy za account kind opcije.
   */
  public trackByOptionValue<T>(index: number, option: SelectOption<T>): T {
    return option.value;
  }

  /**
   * trackBy za string liste.
   */
  public trackByString(index: number, value: string): string {
    return value;
  }

  /**
   * trackBy za klijente.
   */
  public trackByClientId(index: number, client: ClientOption): string {
    return client.id;
  }

  public get isTekuci(): boolean {
    return this.selectedKind === AccountKind.TEKUCI;
  }

  public get isDevizni(): boolean {
    return this.selectedKind === AccountKind.DEVIZNI;
  }

  private get selectedKind(): AccountKind | null {
    return this.form.get('kind')?.value ?? null;
  }

  private get selectedSubtype(): string | null {
    return this.form.get('subtype')?.value ?? null;
  }

  private get selectedCurrency(): string | null {
    return this.form.get('currency')?.value ?? null;
  }

  private get selectedOwnerType(): AccountOwnerType | null {
    return this.form.get('currencyOwnerType')?.value ?? null;
  }

  /**
   * Podesava dinamičke validacije u zavisnosti od izbora korisnika.
   */
  private setupDynamicValidation(): void {
    this.form
      .get('kind')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateStepOneValidators();
        this.updateBusinessValidators();
      });

    this.form
      .get('subtype')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateBusinessValidators();
      });

    this.form
      .get('currencyOwnerType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateBusinessValidators();
      });

    this.updateStepOneValidators();
    this.updateBusinessValidators();
  }

  /**
   * Ažurira validacije prvog koraka forme.
   */
  private updateStepOneValidators(): void {
    const subtypeControl = this.form.get('subtype');
    const currencyControl = this.form.get('currency');
    const currencyOwnerTypeControl = this.form.get('currencyOwnerType');

    subtypeControl?.clearValidators();
    currencyControl?.clearValidators();
    currencyOwnerTypeControl?.clearValidators();

    if (this.selectedKind === AccountKind.TEKUCI) {
      subtypeControl?.setValidators([Validators.required]);
      currencyControl?.setValue(null, { emitEvent: false });
      currencyOwnerTypeControl?.setValue(null, { emitEvent: false });
    }

    if (this.selectedKind === AccountKind.DEVIZNI) {
      currencyControl?.setValidators([Validators.required]);
      currencyOwnerTypeControl?.setValidators([Validators.required]);
      subtypeControl?.setValue(null, { emitEvent: false });
    }

    subtypeControl?.updateValueAndValidity({ emitEvent: false });
    currencyControl?.updateValueAndValidity({ emitEvent: false });
    currencyOwnerTypeControl?.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Ažurira validacije poslovnih polja.
   */
  private updateBusinessValidators(): void {
    const companyFields: string[] = [
      'companyName',
      'companyNumber',
      'companyTaxId',
      'companyActivityCode',
      'companyAddress'
    ];

    companyFields.forEach((field: string) => {
      const control = this.form.get(field);
      control?.clearValidators();

      if (this.isBusiness()) {
        control?.setValidators([Validators.required]);
      }

      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * Pokušava da popuni vlasnika na osnovu navigation state-a.
   */
  private patchCreatedClientFromState(): void {
    const state = window.history.state as CreateClientNavigationState | null;

    if (state?.createdClientId) {
      // If the created client isn't present in the current clients list, add it so
      // the select has an option to preselect.
      const exists = this.clients.some((c) => c.id === state.createdClientId);

      if (!exists) {
        const name = state.createdClientName ?? 'Novi klijent';
        this.clients = [{ id: state.createdClientId, name }, ...this.clients];
      }

      this.form.patchValue({ ownerId: state.createdClientId });
      // If we returned from creating a client, show step 2 so the user can continue
      this.step = 2;
    }
  }

  /**
   * Učitava mock klijente za prikaz u dropdown-u.
   * Dok mentor ne potvrdi API tok, koristi se lokalni prikaz.
   */
  private loadClients(): void {
    // Load clients from backend via ClientService. Map DTO to displayable ClientOption.
    this.clientService
      .getAllClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items: ClientDto[]) => {
          this.clients = items.map((c) => ({
            id: c.id,
            name: c.name ?? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
          }));
        },
        error: (err: unknown) => {
          // Keep existing behavior minimal: log error. UI improvements (toast) can be added later.
          // eslint-disable-next-line no-console
          console.error('Failed to load clients', err);
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}