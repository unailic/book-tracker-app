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

  private cachedBooks: Book[] = [];

  getBooks(): Observable<Book[]> {
    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    return this.http.get<{ [key: string]: Book }>(`${this.dbUrl}/users/${userId}/books.json?auth=${token}`).pipe(
      map(data => {
        if (!data) return [];
        const books = Object.keys(data).map(key => ({ ...data[key], id: key }));
        this.cachedBooks = books;
        return books;
      })
    );
  }

  getUserBooks(): Book[] {
    return this.cachedBooks;
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