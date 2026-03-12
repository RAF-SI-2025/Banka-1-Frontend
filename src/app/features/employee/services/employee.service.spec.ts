import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EmployeeService } from './employee.service';
import { Employee } from '../models/employee';
import { environment } from '../../../../environments/environment';

const mockEmployee: Employee = {
  id: 1,
  ime: 'Petar',
  prezime: 'Petrović',
  email: 'petar@test.com',
  datumRodjenja: '1990-01-01',
  pol: 'M',
  brojTelefona: '+381601234567',
  aktivan: true,
  permisije: ['CREATE', 'EDIT']
};

describe('EmployeeService', () => {
  let service: EmployeeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/employees`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmployeeService]
    });
    service = TestBed.inject(EmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── getEmployees ───────────────────────────────────────────────────────────

  describe('getEmployees', () => {
    it('should send GET request with default pagination params', () => {
      service.getEmployees().subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('50');
      req.flush({ content: [mockEmployee] });
    });

    it('should send GET request with custom pagination params', () => {
      service.getEmployees(2, 10).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('10');
      req.flush({ content: [] });
    });
  });

  // ─── createEmployee ─────────────────────────────────────────────────────────

  describe('createEmployee', () => {
    it('should send POST request with employee data', () => {
      service.createEmployee(mockEmployee).subscribe(res => {
        expect(res).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockEmployee);
      req.flush(mockEmployee);
    });
  });

  // ─── updateEmployee ─────────────────────────────────────────────────────────

  describe('updateEmployee', () => {
    it('should send PUT request with employee data', () => {
      service.updateEmployee(1, mockEmployee).subscribe(res => {
        expect(res).toEqual(mockEmployee);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockEmployee);
      req.flush(mockEmployee);
    });
  });

  // ─── deleteEmployee ─────────────────────────────────────────────────────────

  describe('deleteEmployee', () => {
    it('should send DELETE request', () => {
      service.deleteEmployee(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
