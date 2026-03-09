import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActivateAccountRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Authentication service for handling user authentication operations.
 * Currently contains placeholder methods that will be connected to the real API
 * when AuthService and interceptors from tasks 2-3 are ready.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /**
   * Authenticates user with email and password.
   * @param request - Login credentials
   * @returns Observable with login response containing JWT token and user info
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    // Placeholder: Will be connected to real API later
    // Simulating API delay
    if (request.email === 'test@test.com' && request.password === 'password123') {
      return of({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          email: request.email,
          name: 'Test User',
          role: 'Admin'
        }
      }).pipe(delay(1000));
    }
    return throwError(() => new Error('Invalid credentials')).pipe(delay(1000));
  }

  /**
   * Initiates password reset process by sending reset link to email.
   * @param request - Email address for password reset
   * @returns Observable indicating success/failure
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    // Placeholder: Will be connected to real API later
    return of({ message: 'Password reset link sent to your email' }).pipe(delay(1000));
  }

  /**
   * Resets user password using reset token from email link.
   * @param request - Reset token and new password
   * @returns Observable indicating success/failure
   */
  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    // Placeholder: Will be connected to real API later
    if (request.token === 'invalid-token') {
      return throwError(() => new Error('Invalid or expired token')).pipe(delay(1000));
    }
    return of({ message: 'Password reset successfully' }).pipe(delay(1000));
  }

  /**
   * Activates user account and sets initial password.
   * @param request - Activation token and new password
   * @returns Observable indicating success/failure
   */
  activateAccount(request: ActivateAccountRequest): Observable<{ message: string }> {
    // Placeholder: Will be connected to real API later
    if (request.token === 'invalid-token') {
      return throwError(() => new Error('Invalid or expired activation link')).pipe(delay(1000));
    }
    return of({ message: 'Account activated successfully' }).pipe(delay(1000));
  }
}
