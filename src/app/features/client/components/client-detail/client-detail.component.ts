import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientDto, ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ClientDetailComponent implements OnInit {
  clientForm: FormGroup;
  clientId: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  backendEmailError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {
    this.clientForm = this.fb.group({
      ime: ['', Validators.required],
      prezime: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      brojTelefona: ['', Validators.required],
      adresa: ['', Validators.required],
    });
  }


  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      // Check if client data was passed via navigation state
      const history = window.history.state;
      const passedClient = history?.client;
      
      if (passedClient) {
        this.patchFormWithClient(passedClient);
      } 
    }
  }

  private patchFormWithClient(client: any): void {
    this.clientForm.patchValue({
      ime: client.name || client.ime,
      prezime: client.lastName || client.prezime,
      email: client.email,
      brojTelefona: client.brojTelefona,
      adresa: client.adresa
    });
  }

onSubmit(): void {
  if (this.clientForm.valid && this.clientId) {
    this.isLoading = true;
    this.backendEmailError = null;

    const updateData = this.clientForm.getRawValue();

    this.clientService.updateClient(this.clientId, updateData).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 400 && err.error?.message?.includes('email')) {
          this.backendEmailError = 'Ovaj email je već zauzet.';
          this.clientForm.get('email')?.setErrors({ notUnique: true });
        } else {
          this.errorMessage = 'Greška pri čuvanju izmena.';
        }
      }
    });
  }
}

  onCancel(): void {
    this.router.navigate(['/clients']);
  }
}
