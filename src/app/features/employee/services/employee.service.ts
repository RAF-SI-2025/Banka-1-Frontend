import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  // PR_19 C19.X: posle konsolidacije user-service-a, CrudController je na
  // /employees (ne /employees/employees). Stari frontend je oslanjao na nginx
  // strip /employees/ pa je dodavao jos jedan /employees prefix; sada je
  // route flat.
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.apiUrl, { params });
  }

  searchEmployees(query: string, page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.apiUrl}/search`, { params });
  }

  createEmployee(employeeData: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employeeData);
  }

  updateEmployee(id: number, employeeData: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
