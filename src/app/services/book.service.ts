import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Book } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private dbUrl = environment.firebaseDatabaseUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getUrl(): string {
    const userId = this.authService.getUserId();
    const token = this.authService.getToken();
    return `${this.dbUrl}/users/${userId}/books`;
  }

  getBooks(): Observable<Book[]> {
    const token = this.authService.getToken();
    return this.http.get<{ [key: string]: Book }>(`${this.getUrl()}.json?auth=${token}`).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({ ...data[key], id: key }));
      })
    );
  }

  addBook(book: Omit<Book, 'id'>): Observable<{ name: string }> {
    const token = this.authService.getToken();
    return this.http.post<{ name: string }>(`${this.getUrl()}.json?auth=${token}`, book);
  }

  updateBook(id: string, book: Partial<Book>): Observable<Book> {
    const token = this.authService.getToken();
    return this.http.patch<Book>(`${this.getUrl()}/${id}.json?auth=${token}`, book);
  }

  deleteBook(id: string): Observable<void> {
    const token = this.authService.getToken();
    return this.http.delete<void>(`${this.getUrl()}/${id}.json?auth=${token}`);
  }
}