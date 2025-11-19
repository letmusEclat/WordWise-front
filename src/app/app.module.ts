import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AuthInterceptor } from './services/auth.interceptor';
import { AppComponent } from './app.component';
import { LayoutComponent } from './layout/layout.component';
import { SectionCardComponent } from './components/section-card/section-card.component';
import { WordCardComponent } from './components/word-card/word-card.component';
import { AddWordModalComponent } from './components/add-word-modal/add-word-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { AuthFormComponent } from './components/auth-form/auth-form.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    SectionCardComponent,
    WordCardComponent,
    AddWordModalComponent,
    LoginComponent,
    AuthFormComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
