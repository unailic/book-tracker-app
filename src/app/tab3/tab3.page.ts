import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { CatalogueService } from '../services/catalogue.service';
import { BookService } from '../services/book.service';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel],
})
export class Tab3Page {
  isAdmin = false;

  // korisnik
  books: Book[] = [];
  get totalBooks() { return this.books.length; }
  get finishedBooks() { return this.books.filter(b => b.status === 'finished').length; }
  get readingBooks() { return this.books.filter(b => b.status === 'reading').length; }
  get plannedBooks() { return this.books.filter(b => b.status === 'planned').length; }
  get averageRating(): string {
    const rated = this.books.filter(b => b.rating);
    if (!rated.length) return 'N/A';
    return (rated.reduce((sum, b) => sum + (b.rating || 0), 0) / rated.length).toFixed(1);
  }
  get topRatedBook(): Book | null {
    const rated = this.books.filter(b => b.rating);
    if (!rated.length) return null;
    return rated.reduce((prev, curr) => (curr.rating || 0) > (prev.rating || 0) ? curr : prev);
  }

  // admin
  totalUsers = 0;
  totalCatalogueBooks = 0;
  popularBooks: { title: string, count: number }[] = [];

  constructor(
    private authService: AuthService,
    private bookService: BookService,
    private catalogueService: CatalogueService,
    private http: HttpClient
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ionViewWillEnter() {
    if (this.isAdmin) {
      this.loadAdminStats();
    } else {
      this.bookService.getBooks().subscribe(books => this.books = books);
    }
  }

  loadAdminStats() {
    const token = this.authService.getToken();

    this.http.get<{ [key: string]: any }>(
      `${environment.firebaseDatabaseUrl}/users.json?auth=${token}`
    ).subscribe(data => {
      if (!data) return;
      this.totalUsers = Object.values(data).filter(
              (user: any) => user?.profile?.role !== 'admin'
            ).length;

      const bookCount: { [title: string]: number } = {};
      Object.values(data).forEach((user: any) => {
        if (user.books) {
          Object.values(user.books).forEach((book: any) => {
            if (book.title) {
              bookCount[book.title] = (bookCount[book.title] || 0) + 1;
            }
          });
        }
      });

      this.popularBooks = Object.entries(bookCount)
        .map(([title, count]) => ({ title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    });

    this.catalogueService.getBooks().subscribe(books => {
      this.totalCatalogueBooks = books.length;
    });
  }
}