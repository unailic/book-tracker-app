import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiKey = environment.firebaseApiKey;
  private dbUrl = environment.firebaseDatabaseUrl;

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<AuthResponse> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.apiKey}`;
    return this.http
      .post<AuthResponse>(url, { email, password, returnSecureToken: true })
      .pipe(
        tap(res => this.saveSession(res)),
        switchMap(res => {
          const roleUrl = `${this.dbUrl}/users/${res.localId}/profile.json?auth=${res.idToken}`;
          return this.http.put(roleUrl, { role: 'user', email }).pipe(
            tap(() => localStorage.setItem('role', 'user')),
            switchMap(() => [res])
          );
        })
      );
  }

  login(email: string, password: string): Observable<any> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;
    return this.http
      .post<AuthResponse>(url, { email, password, returnSecureToken: true })
      .pipe(
        tap(res => this.saveSession(res)),
        switchMap(res => {
          const profileUrl = `${this.dbUrl}/users/${res.localId}/profile.json?auth=${res.idToken}`;
          return this.http.get<{ role: string }>(profileUrl).pipe(
            tap(profile => localStorage.setItem('role', profile?.role || 'user')),
            switchMap(() => [res])
          );
        })
      );
  }

  logout(): void {
    localStorage.removeItem('idToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
  }

  getToken(): string | null {
    return localStorage.getItem('idToken');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getRole(): string {
    return localStorage.getItem('role') || 'user';
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('idToken', res.idToken);
    localStorage.setItem('userId', res.localId);
  }
}