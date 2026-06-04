import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/core/services/auth.service';

interface ClientProfile {
  id?: number;
  ime?: string;
  prezime?: string;
  email?: string;
  brojTelefona?: string;
  adresa?: string;
  pol?: string;
  jmbg?: string;
  datumRodjenja?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  profile: ClientProfile | null = null;
  role = '';
  permissions: string[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getLoggedUser() as any;
    this.role = user?.role ?? '';
    this.permissions = user?.permissions ?? [];

    const id = this.auth.getUserIdFromToken();
    if (!id) {
      this.isLoading = false;
      this.errorMessage = 'Nije moguce ucitati profil.';
      return;
    }

    const url = this.auth.isClient()
      ? `${environment.apiUrl}/clients/customers/${id}`
      : `${environment.apiUrl}/employees/${id}`;

    this.http.get<ClientProfile | { data?: ClientProfile }>(url).subscribe({
      next: (res: any) => {
        this.profile = res?.data ?? res;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err?.error?.message ?? 'Greska pri ucitavanju profila.';
        this.isLoading = false;
      },
    });
  }
}
