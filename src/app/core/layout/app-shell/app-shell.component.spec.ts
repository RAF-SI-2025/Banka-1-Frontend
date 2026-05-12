import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let component: AppShellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppShellComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
  });

  it('treats /login as auth route', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/login');
    fixture.detectChanges();
    expect(component.isAuthRoute).toBe(true);
  });

  it('treats /home as non-auth route', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/home');
    fixture.detectChanges();
    expect(component.isAuthRoute).toBe(false);
  });

  it('treats /forgot-password as auth route', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/forgot-password');
    fixture.detectChanges();
    expect(component.isAuthRoute).toBe(true);
  });

  it('treats / (root) as auth route', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/');
    fixture.detectChanges();
    expect(component.isAuthRoute).toBe(true);
  });
});
