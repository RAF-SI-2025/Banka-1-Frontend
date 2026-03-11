import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee';
import { environment } from '../../../../environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  /**
   * Osnovna URL putanja za API resurse zaposlenih.
   * Vrednost se preuzima iz konfiguracionog fajla okruženja.
   */
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  /**
   * Dobavlja paginiranu listu svih zaposlenih iz sistema.
   * Rezultat je upakovan u Page objekat koji sadrži 'content' niz zaposlenih.
   * * @param page Broj stranice koja se dobavlja (počevši od 0). Podrazumevano je 0.
   * @param size Broj zapisa po stranici. Podrazumevano je 50.
   * @returns Observable sa objektom koji sadrži niz Employee objekata i metapodatke o paginaciji.
   */
  getEmployees(page: number = 0, size: number = 50): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Šalje zahtev za kreiranje novog zaposlenog u bazi podataka.
   * Objekat mora sadržati obavezna polja definisana backend validacijom (ime, prezime, email, itd.).
   * * @param employeeData Objekat tipa Employee sa podacima o novom zaposlenom.
   * @returns Observable sa novokreiranim Employee objektom koji uključuje dodeljen ID.
   */
  createEmployee(employeeData: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employeeData);
  }

  /**
   * Ažurira podatke postojećeg zaposlenog identifikovanog preko njegovog ID-ja.
   * Koristi se za unapređenja, promenu departmana ili promenu statusa aktivnosti.
   * * @param id Jedinstveni identifikator zaposlenog kojeg menjamo.
   * @param employeeData Objekat sa ažuriranim podacima zaposlenog.
   * @returns Observable sa izmenjenim Employee objektom nakon uspešne operacije.
   */
  updateEmployee(id: number, employeeData: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData);
  }

  /**
   * Vrši deaktivaciju ili logičko brisanje (soft delete) zaposlenog iz sistema.
   * Na backendu se obično postavlja flag 'deleted' na true umesto fizičkog uklanjanja iz baze.
   * * @param id Jedinstveni identifikator zaposlenog kojeg želimo da obrišemo.
   * @returns Observable tipa void koja označava kraj operacije.
   */
  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}