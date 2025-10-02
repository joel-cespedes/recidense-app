import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  sub: string;
  alias: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private router = inject(Router);

  // Estado privado
  private _authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Señales públicas de solo lectura
  user = computed(() => this._authState().user);
  isAuthenticated = computed(() => this._authState().isAuthenticated);
  isLoading = computed(() => this._authState().isLoading);

  constructor() {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const user = this.decodeJWT(token);
        this._authState.update(state => ({
          ...state,
          user: user,
          isAuthenticated: true,
          isLoading: false
        }));
      } catch (error) {
        this.clearAuth();
      }
    } else {
      this.clearAuth();
    }
  }

  private decodeJWT(token: string): User {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.loadUserProfile();
  }

  clearAuth(): void {
    localStorage.removeItem('access_token');
    this._authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }
}
