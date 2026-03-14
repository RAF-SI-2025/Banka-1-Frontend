import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  template: `
    <div class="error-page">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="error-card">
        <div class="error-icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 class="error-code">403</h1>
        <h2 class="error-title">Access denied</h2>
        <p class="error-description">You don't have permission to access this page. Contact your administrator if you think this is an error.</p>
        <button class="error-button" (click)="goHome()">Go to homepage</button>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(160deg, #14532d 0%, #15803d 30%, #16a34a 60%, #22c55e 100%);
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
    }
    .bg-circle-1 {
      width: 500px; height: 500px; top: -150px; right: -100px;
    }
    .bg-circle-2 {
      width: 350px; height: 350px; bottom: -100px; left: -80px;
    }
    .error-card {
      background: rgba(255, 255, 255, 0.97);
      border-radius: 20px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 40px rgba(34, 197, 94, 0.1);
      position: relative;
      z-index: 1;
      animation: card-enter 0.4s ease-out;
    }
    @keyframes card-enter {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .error-icon-circle {
      width: 72px;
      height: 72px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }
    .error-icon-circle svg {
      width: 36px;
      height: 36px;
      color: #ef4444;
    }
    .error-code {
      font-size: 72px;
      font-weight: 800;
      color: #ef4444;
      margin: 0 0 8px;
      line-height: 1;
    }
    .error-title {
      font-size: 22px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 12px;
    }
    .error-description {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 32px;
      line-height: 1.6;
    }
    .error-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 28px;
      background: linear-gradient(135deg, #166534, #16a34a, #22c55e);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
    }
    .error-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
    }
  `]
})
export class ForbiddenComponent {
  constructor(private router: Router) {}
  goHome(): void { this.router.navigate(['/']); }
}
