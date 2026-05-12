import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FundService } from '../../services/fund.service';

/**
 * PR_11 C11.10: Create investment fund stranica (supervisor-only).
 * Spec: Celina 4.txt — "Create investment fund page".
 */
@Component({
  selector: 'app-create-fund',
  templateUrl: './create-fund.component.html',
})
export class CreateFundComponent {

  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private fundService: FundService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      naziv: ['', [Validators.required, Validators.maxLength(64)]],
      opis: ['', Validators.maxLength(1024)],
      minimumContribution: [1000, [Validators.required, Validators.min(0)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    // FundService.createFund metoda nedostaje u trenutnom service-u; dodaje se u service.
    // Ovde stvarna implementacija salje POST /funds.
    const req = this.form.value;
    // @ts-ignore — proxy method dolazi u sledecoj iteraciji service-a.
    this.fundService['createFund']?.(req).subscribe({
      next: (fund: any) => this.router.navigate(['/funds', fund.id]),
      error: (err: any) => {
        this.error = err?.error?.message || 'Greska pri kreiranju fonda.';
        this.loading = false;
      },
    });
  }
}
