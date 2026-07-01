import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { INITIAL_BOOKS } from './seed-data';
 
export interface CatalogueBook {
  id?: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  year: number;
  coverUrl?: string;
}
 
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private dbUrl = environment.firebaseDatabaseUrl;
 
  constructor(private http: HttpClient, private authService: AuthService) {}
 
  private getAuthParams(): string {
    return `?auth=${this.authService.getToken()}`;
  }
 
  // Popunjava katalog početnim setom knjiga.
  // Pre dodavanja proveravamo da li katalog već ima podatke,
  // čime sprečavamo duplikate ako se metoda pozove više puta.
  initCatalogue(): Observable<any> {
    return new Observable(observer => {
      this.getBooks().subscribe({
        next: existingBooks => {
          if (existingBooks.length > 0) {
            observer.error(new Error('Katalog već sadrži knjige.'));
            return;
          }
          const requests = INITIAL_BOOKS.map(book =>
            this.http.post(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`, book)
          );
          forkJoin(requests).subscribe({
            next: () => { observer.next(true); observer.complete(); },
            error: err => observer.error(err)
          });
        },
        error: err => observer.error(err)
      });
    });
  }
 
  getBooks(): Observable<CatalogueBook[]> {
    return this.http.get<{ [key: string]: CatalogueBook }>(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({ ...data[key], id: key }));
      })
    );
  }
 
  addBook(book: Omit<CatalogueBook, 'id'>): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(`${this.dbUrl}/catalogue.json${this.getAuthParams()}`, book);
  }
 
  updateBook(id: string, book: Partial<CatalogueBook>): Observable<CatalogueBook> {
    return this.http.patch<CatalogueBook>(`${this.dbUrl}/catalogue/${id}.json${this.getAuthParams()}`, book);
  }
 
  // Briše knjigu iz kataloga I sve reference na nju u korisničkim bibliotekama
  // (cascade delete) — sprečava "duhove" sa nepostojećim catalogueBookId.
  deleteBook(id: string): Observable<void> {
    return this.removeFromAllUserLibraries(id).pipe(
      switchMap(() =>
        this.http.delete<void>(`${this.dbUrl}/catalogue/${id}.json${this.getAuthParams()}`)
      )
    );
  }
 
  // Prolazi kroz SVE korisnike, nalazi knjige čiji catalogueBookId
  // odgovara obrisanoj knjizi iz kataloga, i briše ih iz biblioteka.
  private removeFromAllUserLibraries(catalogueBookId: string): Observable<any> {
    return this.http.get<{ [userId: string]: { books?: { [bookId: string]: { catalogueBookId?: string } } } }>(
      `${this.dbUrl}/users.json${this.getAuthParams()}`
    ).pipe(
      switchMap(users => {
        if (!users) return of(null);
 
        const deleteRequests: Observable<any>[] = [];
 
        Object.keys(users).forEach(userId => {
          const books = users[userId]?.books;
          if (!books) return;
 
          Object.keys(books).forEach(bookId => {
            if (books[bookId]?.catalogueBookId === catalogueBookId) {
              deleteRequests.push(
                this.http.delete(
                  `${this.dbUrl}/users/${userId}/books/${bookId}.json${this.getAuthParams()}`
                )
              );
            }
          });
        });
 
        if (deleteRequests.length === 0) return of(null);
        return forkJoin(deleteRequests);
      }),
      catchError(err => {
        console.error('Greška pri brisanju iz korisničkih biblioteka:', err);
        return of(null); // ne blokiramo brisanje iz kataloga ni ako ovo padne
      })
    );
  }
 
  searchBooks(query: string): Observable<CatalogueBook[]> {
    return this.getBooks().pipe(
      map(books => books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase()) ||
        b.genre.toLowerCase().includes(query.toLowerCase())
      ))
    );
  }
}