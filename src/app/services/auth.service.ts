import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AuthUser {
  email: string;
  displayName: string;
  avatar?: string;
}

const STORAGE_KEY = 'ww_current_user';

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

  clearUser() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
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
