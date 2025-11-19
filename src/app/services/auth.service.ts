import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AuthUser {
  email: string;
  displayName: string;
  avatar?: string;
}

const STORAGE_KEY = 'ww_current_user';
const TOKEN_KEY = 'ww_token';
const USER_ID_KEY = 'ww_user_id';

interface LoginResponse {
  token: string;
  idUsuario: number;
  nombreUsuario: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(this.restore());
  public readonly user$ = this.userSubject.asObservable();

  private deriveDisplayName(email: string): string {
    const base = (email || '').split('@')[0];
    if (!base) return email;
    return base
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  constructor(private http: HttpClient) {}

  setUser(email: string, avatar?: string) {
    const user: AuthUser = {
      email,
      displayName: this.deriveDisplayName(email),
      avatar: avatar || 'assets/img/avatar-juan.svg'
    };
    this.userSubject.next(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
  }

  login(username: string, password: string): Observable<AuthUser> {
    const url = `${environment.apiBaseUrl}/login`;
    return this.http.post<LoginResponse>(url, { username, password }).pipe(
      tap(res => {
        try {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_ID_KEY, String(res.idUsuario));
        } catch {}
        this.setUser(res.nombreUsuario);
      }),
      map(() => this.userSubject.value as AuthUser)
    );
  }

  register(username: string, password: string): Observable<void> {
    const url = `${environment.apiBaseUrl}/api/usuario/register`;
    return this.http.post(url, { username, password }).pipe(tap(() => {
      // Opcional: auto-login después del registro
      this.setUser(username);
    })) as Observable<void>;
  }

  deleteAccount(): Observable<void> {
    const url = `${environment.apiBaseUrl}/api/usuario`;
    const idUsuario = this.getUserId();
    return this.http.delete(url, { headers: { idUsuario: String(idUsuario) } }).pipe(tap(() => this.clearUser())) as Observable<void>;
  }

  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  getUserId(): number | null { const raw = localStorage.getItem(USER_ID_KEY); return raw ? Number(raw) : null; }

  clearUser() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { localStorage.removeItem(USER_ID_KEY); } catch {}
    this.userSubject.next(null);
  }

  get current(): AuthUser | null {
    return this.userSubject.value;
  }

  private restore(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
