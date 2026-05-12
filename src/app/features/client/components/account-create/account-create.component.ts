import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '../../services/account.service';
import { type ClientDto, ClientService } from '../../services/client.service';
import { exactDigitsValidator } from '../../../../shared/utils/validators';
/**
 * Tip računa.
 */
enum AccountKind {
  CHECKING = 'CHECKING',
  FX = 'FX'
}

/**
 * Tip vlasništva za devizni račun.
 */
enum AccountOwnerType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS'
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
  naziv: string;
  maticniBroj: string;
  poreskiBroj: string;
  sifraDelatnosti: string;
  adresa: string;
  vlasnik: number;
}

/**
 * Payload za kreiranje FX računa.
 */
interface FxAccountCreatePayload {
  nazivRacuna: string;
  idVlasnika: number;
  jmbg: string;
  currencyCode: string;
  tipRacuna: AccountOwnerType;
  initialBalance: number;
  createCard: boolean;
  firma?: CompanyPayload;
}

/**
 * Payload za kreiranje tekućeg računa.
 */
interface CheckingAccountCreatePayload {
  nazivRacuna: string;
  idVlasnika: number;
  jmbg: string;
  vrstaRacuna: string;
  initialBalance: number;
  createCard: boolean;
  firma?: CompanyPayload;
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
  styleUrls: ['./account-create.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class AccountCreateComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public form!: FormGroup;
  public step = 1;
  public submitted = false;

  public readonly accountKinds: SelectOption<AccountKind>[] = [
    { value: AccountKind.CHECKING, label: 'Tekući' },
    { value: AccountKind.FX, label: 'Devizni' }
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

  public readonly activityCodes: SelectOption<string>[] = [
    { value: '1.11', label: '1.11 - Uzgoj žitarica i mahunarki' },
    { value: '1.13', label: '1.13 - Uzgoj povrća' },
    { value: '13.1', label: '13.1 - Priprema i predenje tekstilnih vlakana' },
    { value: '24.1', label: '24.1 - Proizvodnja gvožđa i čelika' },
    { value: '24.2', label: '24.2 - Proizvodnja čeličnih cevi' },
    { value: '41.1', label: '41.1 - Razvoj građevinskih projekata' },
    { value: '41.2', label: '41.2 - Izgradnja stambenih i nestambenih zgrada' },
    { value: '42.11', label: '42.11 - Izgradnja puteva i autoputeva' },
    { value: '42.12', label: '42.12 - Izgradnja železničkih i podzemnih pruga' },
    { value: '42.13', label: '42.13 - Izgradnja mostova i tunela' },
    { value: '42.21', label: '42.21 - Izgradnja vodovodnih projekata' },
    { value: '42.22', label: '42.22 - Izgradnja elektroenergetskih mreža' },
    { value: '5.1', label: '5.1 - Vađenje uglja' },
    { value: '7.1', label: '7.1 - Vađenje gvozdenih ruda' },
    { value: '8.11', label: '8.11 - Eksploatacija kamena' },
    { value: '47.11', label: '47.11 - Trgovina na malo' },
    { value: '56.1', label: '56.1 - Restorani i ugostiteljstvo' },
    { value: '62.01', label: '62.01 - Računarsko programiranje' },
    { value: '62.09', label: '62.09 - Ostale IT usluge' },
    { value: '63.11', label: '63.11 - Obrada podataka i hosting' },
    { value: '64.19', label: '64.19 - Ostale finansijske delatnosti' },
    { value: '64.91', label: '64.91 - Finansijski lizing' },
    { value: '65.11', label: '65.11 - Životno osiguranje' },
    { value: '65.12', label: '65.12 - Neživotno osiguranje' },
    { value: '66.21', label: '66.21 - Procena rizika i štete' },
    { value: '68.1', label: '68.1 - Poslovanje nekretninama' },
    { value: '53.1', label: '53.1 - Poštanske aktivnosti' },
    { value: '53.2', label: '53.2 - Kurirske aktivnosti' },
    { value: '85.1', label: '85.1 - Predškolsko obrazovanje' },
    { value: '85.2', label: '85.2 - Osnovno obrazovanje' },
    { value: '86.1', label: '86.1 - Bolničke aktivnosti' },
    { value: '86.21', label: '86.21 - Opšta medicinska praksa' },
    { value: '86.22', label: '86.22 - Specijalistička medicinska praksa' },
    { value: '86.9', label: '86.9 - Ostale zdravstvene aktivnosti' },
    { value: '84.12', label: '84.12 - Regulisanje delatnosti privrede' },
    { value: '90.01', label: '90.01 - Delatnost pozorišta' },
    { value: '90.02', label: '90.02 - Delatnost muzeja' },
    { value: '90.04', label: '90.04 - Botanički i zoološki vrtovi' },
    { value: '93.11', label: '93.11 - Sportski objekti' },
    { value: '93.13', label: '93.13 - Delatnost teretana' },
    { value: '93.19', label: '93.19 - Ostale sportske aktivnosti' },
    { value: '26.11', label: '26.11 - Proizvodnja elektronskih komponenti' },
    { value: '27.12', label: '27.12 - Proizvodnja električnih panela' },
    { value: '29.1', label: '29.1 - Proizvodnja motornih vozila' }
  ];

  public clients: ClientOption[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
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

    if (this.selectedKind === AccountKind.CHECKING && !subtypeControl?.valid) {
      return;
    }

    if (
      this.selectedKind === AccountKind.FX &&
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
    if (this.selectedKind === AccountKind.CHECKING) {
      return this.tekuciBusiness.includes(this.selectedSubtype ?? '');
    }

    if (this.selectedKind === AccountKind.FX) {
      return this.selectedOwnerType === AccountOwnerType.BUSINESS;
    }

    return false;
  }

  /**
   * Obrađuje submit forme.
   * Trenutno samo formira i ispisuje payload.
   */
    //----------------------------------------------------------------------
    // SIFRE DELATNOSTI, OBAVEZNO
    //----------------------------------------------------------------------
    // 1.11 - Uzgoj žitarica i mahunarki
    // 1.13 - Uzgoj povrća
    // 13.1 - Priprema i predenje tekstilnih vlakana
    // 24.1 - Proizvodnja gvožđa i čelika
    // 24.2 - Proizvodnja čeličnih cevi
    // 41.1 - Razvoj građevinskih projekata
    // 41.2 - Izgradnja stambenih i nestambenih zgrada
    // 42.11 - Izgradnja puteva i autoputeva
    // 42.12 - Izgradnja železničkih i podzemnih pruga
    // 42.13 - Izgradnja mostova i tunela
    // 42.21 - Izgradnja vodovodnih projekata
    // 42.22 - Izgradnja elektroenergetskih mreža
    // 5.1 - Vađenje uglja
    // 7.1 - Vađenje gvozdenih ruda
    // 8.11 - Eksploatacija kamena
    // 47.11 - Trgovina na malo
    // 56.1 - Restorani i ugostiteljstvo
    // 62.01 - Računarsko programiranje
    // 62.09 - Ostale IT usluge
    // 63.11 - Obrada podataka i hosting
    // 64.19 - Ostale finansijske delatnosti
    // 64.91 - Finansijski lizing
    // 65.11 - Životno osiguranje
    // 65.12 - Neživotno osiguranje
    // 66.21 - Procena rizika i štete
    // 68.1 - Poslovanje nekretninama
    // 53.1 - Poštanske aktivnosti
    // 53.2 - Kurirske aktivnosti
    // 85.1 - Predškolsko obrazovanje
    // 85.2 - Osnovno obrazovanje
    // 86.1 - Bolničke aktivnosti
    // 86.21 - Opšta medicinska praksa
    // 86.22 - Specijalistička medicinska praksa
    // 86.9 - Ostale zdravstvene aktivnosti
    // 84.12 - Regulisanje delatnosti privrede
    // 90.01 - Delatnost pozorišta
    // 90.02 - Delatnost muzeja
    // 90.04 - Botanički i zoološki vrtovi
    // 93.11 - Sportski objekti
    // 93.13 - Delatnost teretana
    // 93.19 - Ostale sportske aktivnosti
    // 26.11 - Proizvodnja elektronskih komponenti
    // 27.12 - Proizvodnja električnih panela
    // 29.1 - Proizvodnja motornih vozila


  public submit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const companyPayload: CompanyPayload | undefined = this.isBusiness()
      ? {
          naziv: this.form.get('companyName')?.value,
          maticniBroj: this.form.get('companyNumber')?.value,
          poreskiBroj: this.form.get('companyTaxId')?.value,
          sifraDelatnosti: this.form.get('companyActivityCode')?.value,
          adresa: this.form.get('companyAddress')?.value,
          vlasnik: +this.form.get('ownerId')?.value
        }
      : undefined;

    const ownerId = this.form.get('ownerId')?.value;
    const createCard = this.form.get('createCard')?.value;
    const initialBalance = this.form.get('initialBalance')?.value;

    if (this.selectedKind === AccountKind.FX) {      
      const payload: FxAccountCreatePayload = {
        idVlasnika: +ownerId,
        jmbg: '',
        currencyCode: this.selectedCurrency ?? 'EUR',
        tipRacuna: this.selectedOwnerType ?? AccountOwnerType.PERSONAL,
        nazivRacuna: 'Devizni racun',
        initialBalance,
        createCard
      };
      if (companyPayload) {
        payload.firma = companyPayload;
      }

      this.accountService.createFxAccount(payload).subscribe({
        next: () => this.router.navigate(['/account-management']),
        error: (err: unknown) => {
          console.error('Failed to create FX account', err);
        }
      });
    } else {
      const subtypeMap: Record<string, string> = {
        'standardni': 'STANDARDNI',
        'štedni': 'STEDNI',
        'penzionerski': 'PENZIONERSKI',
        'za mlade': 'ZA_MLADE',
        'za studente': 'ZA_STUDENTE',
        'za nezaposlene': 'ZA_NEZAPOSLENE',
        'DOO': 'DOO',
        'AD': 'AD',
        'fondacija': 'FONDACIJA'
      };

      const payload: CheckingAccountCreatePayload = {
        idVlasnika: +ownerId,
        jmbg: '',
        vrstaRacuna: subtypeMap[this.selectedSubtype ?? ''] ?? 'CHECKING',
        initialBalance,
        createCard,
        nazivRacuna: 'Tekuci racun'
      };
      if (companyPayload) {
        payload.firma = companyPayload;
      }

      this.accountService.createCheckingAccount(payload).subscribe({
        next: () => this.router.navigate(['/account-management']),
        error: (err: unknown) => {
          console.error('Failed to create checking account', err);
        }
      });
    }
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
    return this.selectedKind === AccountKind.CHECKING;
  }

  public get isDevizni(): boolean {
    return this.selectedKind === AccountKind.FX;
  }

  private get selectedKind(): AccountKind {
    return this.form.get('kind')?.value;
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

    if (this.selectedKind === AccountKind.CHECKING) {
      subtypeControl?.setValidators([Validators.required]);
      currencyControl?.setValue(null, { emitEvent: false });
      currencyOwnerTypeControl?.setValue(null, { emitEvent: false });
    }

    if (this.selectedKind === AccountKind.FX) {
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
    const companyName = this.form.get('companyName');
    const companyNumber = this.form.get('companyNumber');
    const companyTaxId = this.form.get('companyTaxId');
    const companyActivityCode = this.form.get('companyActivityCode');
    const companyAddress = this.form.get('companyAddress');

    companyName?.clearValidators();
    companyNumber?.clearValidators();
    companyTaxId?.clearValidators();
    companyActivityCode?.clearValidators();
    companyAddress?.clearValidators();

    if (this.isBusiness()) {
      companyName?.setValidators([Validators.required]);
      companyNumber?.setValidators([Validators.required, exactDigitsValidator(8)]);
      companyTaxId?.setValidators([Validators.required, exactDigitsValidator(9)]);
      companyActivityCode?.setValidators([Validators.required]);
      companyAddress?.setValidators([Validators.required]);
    }

    companyName?.updateValueAndValidity({ emitEvent: false });
    companyNumber?.updateValueAndValidity({ emitEvent: false });
    companyTaxId?.updateValueAndValidity({ emitEvent: false });
    companyActivityCode?.updateValueAndValidity({ emitEvent: false });
    companyAddress?.updateValueAndValidity({ emitEvent: false });
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
          this.clients = items.map((client) => ({
            id: String(client.id),
            name: `${client.ime ?? ''} ${client.prezime ?? ''}`.trim() || `Klijent #${client.id}`
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
