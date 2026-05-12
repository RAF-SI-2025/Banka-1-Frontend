import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { AuthService } from '../../services/auth.service';

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;
  let routerSpy: jasmine.Spy;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['getLoggedUser']);
    authSpy.getLoggedUser.and.returnValue({
      email: 'a@b.c',
      permissions: ['BANKING_BASIC', 'CLIENT'],
    } as any);

    await TestBed.configureTestingModule({
      declarations: [CommandPaletteComponent],
      imports: [RouterTestingModule, FormsModule, LucideIconComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    routerSpy = spyOn(TestBed.inject(Router), 'navigate');
  });

  it('opens on banka:open-command-palette event', () => {
    fixture.detectChanges();
    window.dispatchEvent(new CustomEvent('banka:open-command-palette'));
    expect(component.open).toBe(true);
  });

  it('initial results are first 6 items', () => {
    fixture.detectChanges();
    expect(component.results.length).toBeLessThanOrEqual(6);
    expect(component.results.length).toBeGreaterThan(0);
  });

  it('filters results by query (substring match)', () => {
    fixture.detectChanges();
    component.openModal();
    component.query = 'racun';
    component.onInput();
    expect(component.results.length).toBeGreaterThan(0);
    expect(component.results[0].label.toLowerCase()).toContain('racun');
  });

  it('returns empty results for unknown query', () => {
    fixture.detectChanges();
    component.openModal();
    component.query = 'xyzqqq123';
    component.onInput();
    expect(component.results.length).toBe(0);
  });

  it('Enter navigates to selected route and closes modal', () => {
    fixture.detectChanges();
    component.openModal();
    expect(component.results.length).toBeGreaterThan(0);
    const first = component.results[0];
    component.selectedIndex = 0;
    const ev = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeydown(ev);
    expect(routerSpy).toHaveBeenCalledWith([first.route]);
    expect(component.open).toBe(false);
  });

  it('Escape closes modal', () => {
    fixture.detectChanges();
    component.openModal();
    const ev = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeydown(ev);
    expect(component.open).toBe(false);
  });

  it('ArrowDown increments selectedIndex', () => {
    fixture.detectChanges();
    component.openModal();
    const before = component.selectedIndex;
    const ev = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeydown(ev);
    expect(component.selectedIndex).toBe(
      Math.min(component.results.length - 1, before + 1),
    );
  });

  it('ArrowUp does not go below 0', () => {
    fixture.detectChanges();
    component.openModal();
    component.selectedIndex = 0;
    const ev = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.onKeydown(ev);
    expect(component.selectedIndex).toBe(0);
  });
});
