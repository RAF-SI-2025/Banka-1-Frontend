import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FundService } from '../../services/fund.service';

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
      minimumContribution: [1000, [Validators.required, Validators.min(1)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.fundService.createFund(this.form.value).subscribe({
      next: fund => this.router.navigate(['/funds', fund.id]),
      error: err => {
        this.error = err?.error?.message || 'Greska pri kreiranju fonda.';
        this.loading = false;
      },
    });
  }
}
