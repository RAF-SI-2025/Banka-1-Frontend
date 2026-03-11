import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EmployeeListComponent } from './features/employee/components/employee-list/employee-list.component';
import { EmployeeEditComponent } from './features/employee/components/employee-edit/employee-edit.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { LoginComponent } from './core/components/login/login.component';

import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }