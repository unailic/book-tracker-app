import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
 
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
 
  // Token živi SAMO u memoriji — ne u localStorage
  private user?: User | null;
  private role: string = 'user';
 
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
            tap(() => { this.role = 'user'; }),
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
            tap(profile => { this.role = profile?.role || 'user'; }),
            switchMap(() => [res])
          );
        })
      );
  }
 
  logout(): void {
    this.user = null;
    this.role = 'user';
  }
 
  private saveSession(res: AuthResponse): void {
    const expirationTime = new Date(
      new Date().getTime() + +res.expiresIn * 1000
    );
    this.user = new User(res.localId, res.email, res.idToken, expirationTime);
  }
 
  getToken(): string | null {
    return this.user ? this.user.token : null;
  }
 
  getUserId(): string | null {
    return this.user ? this.user.id : null;
  }
 
  getRole(): string {
    return this.role;
  }
 
  isAdmin(): boolean {
    return this.role === 'admin';
  }
 
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}