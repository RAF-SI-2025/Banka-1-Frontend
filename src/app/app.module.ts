import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ThemeService } from './core/services/theme.service';
import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { TopbarComponent } from './core/layout/topbar/topbar.component';
import { CommandPaletteComponent } from './core/layout/command-palette/command-palette.component';
import { LucideIconComponent } from './shared/icons/lucide-icon.component';

import { EmployeeModule } from './features/employee/employee.module';

import { FormsModule } from '@angular/forms';

import { ToastComponent } from './shared/components/toast/toast.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ForbiddenComponent } from './shared/components/forbidden/forbidden.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    ToastComponent,
    NotFoundComponent,
    ForbiddenComponent,
    AppShellComponent,
    SidebarComponent,
    TopbarComponent,
    CommandPaletteComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    CommonModule,
    EmployeeModule,
    // PR_31 Phase 4: LucideIconComponent prebacen na standalone radi
    // import-a iz StateComponent-a (StateComponent je standalone — ne moze
    // imports-ovati ne-standalone komponentu). Spec-ovi koji ga koriste su
    // takodje azurirani da ga drze u imports umesto declarations.
    LucideIconComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => theme.init(),
      deps: [ThemeService],
      multi: true,
    }
  ],
  // PR_31 T8: CUSTOM_ELEMENTS_SCHEMA uklonjen — sve cetiri shell komponente
  // (AppShell + Sidebar + Topbar + CommandPalette) su sad registrovane u
  // declarations-u, vise nije potreban "unknown element" escape hatch.
  bootstrap: [AppComponent]
})
export class AppModule { }
