import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { BookService } from '../services/book.service';
import { CatalogueService } from '../services/catalogue.service';
import { Book } from '../models/book.model';
 
interface UserProfile {
  id?: string;
  email: string;
  role: string;
}
 
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class Tab2Page {
  isAdmin = false;
 
  // Admin
  users: UserProfile[] = [];
  totalUsers = 0;
  totalCatalogueBooks = 0;
  popularBooks: { title: string, count: number }[] = [];
 
  // User
  userBooks: Book[] = [];
  book: any = { title: '', author: '', status: 'planned', rating: undefined, notes: '', userId: '' };
  isEditing = false;
  bookId = '';
 
  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private bookService: BookService,
    private catalogueService: CatalogueService,
    private alertCtrl: AlertController,
  ) {
    addIcons({ trash, create });
    this.isAdmin = this.authService.isAdmin();
  }
 
  ionViewWillEnter() {
    if (this.isAdmin) {
      this.loadUsers();
      this.loadAdminStats();
    } else {
      this.isEditing = false;
      this.loadUserBooks();
    }
  }
 
  // ===== ADMIN =====
 
  loadUsers() {
    const token = this.authService.getToken();
    this.http.get<{ [key: string]: { profile: UserProfile } }>(
      `${environment.firebaseDatabaseUrl}/users.json?auth=${token}`
    ).subscribe(data => {
      if (!data) return;
      this.users = Object.keys(data)
        .filter(key => data[key]?.profile?.role !== 'admin')
        .map(key => ({
          id: key,
          email: data[key]?.profile?.email || 'N/A',
          role: data[key]?.profile?.role || 'user'
        }));
    });
  }
 
  loadAdminStats() {
    const token = this.authService.getToken();
    this.http.get<{ [key: string]: any }>(
      `${environment.firebaseDatabaseUrl}/users.json?auth=${token}`
    ).subscribe(data => {
      if (!data) return;
      this.totalUsers = Object.values(data)
        .filter((user: any) => user?.profile?.role !== 'admin').length;
 
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
 
  async deleteUser(userId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Brisanje korisnika',
      message: 'Da li ste sigurni da želite da obrišete ovog korisnika?',
      cssClass: 'book-alert',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        { text: 'Obriši', role: 'destructive', cssClass: 'delete-button',
          handler: () => {
            const token = this.authService.getToken();
            this.http.delete(`${environment.firebaseDatabaseUrl}/users/${userId}.json?auth=${token}`)
              .subscribe(() => this.loadUsers());
          }
        }
      ]
    });
    await alert.present();
  }
 
  // ===== USER =====
 
  loadUserBooks() {
    this.bookService.getBooks().subscribe(books => this.userBooks = books);
  }
 
  get plannedBooks() { return this.userBooks.filter(b => b.status === 'planned'); }
  get readingBooks() { return this.userBooks.filter(b => b.status === 'reading'); }
  get finishedBooks() { return this.userBooks.filter(b => b.status === 'finished'); }
 
  editUserBook(book: Book) {
    this.book = { ...book };
    this.bookId = book.id!;
    this.isEditing = true;
  }
 
  async deleteUserBook(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Brisanje knjige',
      message: 'Da li ste sigurni da želite da obrišete ovu knjigu?',
      cssClass: 'book-alert',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        { text: 'Obriši', role: 'destructive', cssClass: 'delete-button',
          handler: () => this.bookService.deleteBook(id).subscribe(() => this.loadUserBooks())
        }
      ]
    });
    await alert.present();
  }
 
  saveUserBook() {
    const bookToSave = { ...this.book };
    if (!bookToSave.rating) bookToSave.rating = null;
    this.bookService.updateBook(this.bookId, bookToSave).subscribe(() => {
      this.isEditing = false;
      this.loadUserBooks();
    });
  }
}