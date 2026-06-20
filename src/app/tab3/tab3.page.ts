import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, AlertController } from '@ionic/angular/standalone';
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
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class Tab3Page {
  isAdmin = false;

  // profil
  email = '';
  username = '';
  avatarUrl = '';
  isEditingProfile = false;
  tempUsername = '';
  tempAvatarUrl = '';

  // korisnik statistike
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
  get topRatedBooks(): Book[] {
    const rated = this.books.filter(b => b.rating);
    if (!rated.length) return [];
    const maxRating = Math.max(...rated.map(b => b.rating || 0));
    return rated.filter(b => b.rating === maxRating);
  }

  // admin statistike
  totalUsers = 0;
  totalCatalogueBooks = 0;
  popularBooks: { title: string, count: number }[] = [];

  constructor(
    private authService: AuthService,
    private bookService: BookService,
    private catalogueService: CatalogueService,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.email = localStorage.getItem('email') || '';
  }

  ionViewWillEnter() {
    if (this.isAdmin) {
      this.loadAdminStats();
    } else {
      this.bookService.getBooks().subscribe(books => this.books = books);
      this.loadProfile();
    }
  }

  loadProfile() {
    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    this.http.get<any>(`${environment.firebaseDatabaseUrl}/users/${userId}/profile.json?auth=${token}`)
      .subscribe(data => {
        if (data) {
          this.email = data.email || '';
          this.username = data.username || '';
          this.avatarUrl = data.avatarUrl || '';
        }
      });
  }

  openEditProfile() {
    this.tempUsername = this.username;
    this.tempAvatarUrl = this.avatarUrl;
    this.isEditingProfile = true;
  }

  saveProfile() {
    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    const profile = {
      email: this.email,
      role: 'user',
      username: this.tempUsername,
      avatarUrl: this.tempAvatarUrl
    };
    this.http.patch(`${environment.firebaseDatabaseUrl}/users/${userId}/profile.json?auth=${token}`, profile)
      .subscribe(() => {
        this.username = this.tempUsername;
        this.avatarUrl = this.tempAvatarUrl;
        this.isEditingProfile = false;
      });
  }

  getInitials(): string {
    if (this.username) return this.username.slice(0, 2).toUpperCase();
    if (this.email) return this.email.slice(0, 2).toUpperCase();
    return '??';
  }

  loadAdminStats() {
    const token = this.authService.getToken();
    this.http.get<{ [key: string]: any }>(
      `${environment.firebaseDatabaseUrl}/users.json?auth=${token}`
    ).subscribe(data => {
      if (!data) return;
      this.totalUsers = Object.values(data).filter((user: any) => user?.profile?.role !== 'admin').length;

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