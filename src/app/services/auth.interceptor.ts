import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const userId = this.auth.getUserId();
    if (!token && !userId) {
      return next.handle(req);
    }
    let headers = req.headers;
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (userId) headers = headers.set('idUsuario', String(userId));
    const authReq = req.clone({ headers });
    return next.handle(authReq);
  }
}
