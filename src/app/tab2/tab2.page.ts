import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { CatalogueService, CatalogueBook } from '../services/catalogue.service';
import { BookService } from '../services/book.service';
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
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonTextarea, IonBadge],
})
export class Tab2Page {
  isAdmin = false;
  users: UserProfile[] = [];
  userBooks: Book[] = [];

  book: any = { title: '', author: '', status: 'planned', rating: undefined, notes: '', userId: '' };
  isEditing = false;
  bookId = '';

  catalogueBook: CatalogueBook = { title: '', author: '', genre: '', description: '', year: new Date().getFullYear() };
  editingCatalogueId = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private catalogueService: CatalogueService,
    private bookService: BookService,
    private router: Router
  ) {
    addIcons({ trash, create });
    this.isAdmin = this.authService.isAdmin();
  }

  ionViewWillEnter() {
    if (this.isAdmin) {
      const state = history.state as { book: CatalogueBook } | undefined;
      if (state?.book) {
        this.catalogueBook = { ...state.book };
        this.editingCatalogueId = state.book.id!;
      } else {
        this.catalogueBook = { title: '', author: '', genre: '', description: '', year: new Date().getFullYear() };
        this.editingCatalogueId = '';
      }
      this.loadUsers();
    } else {
      this.isEditing = false;
      this.loadUserBooks();
    }
  }

  loadUserBooks() {
    this.bookService.getBooks().subscribe(books => this.userBooks = books);
  }

  editUserBook(book: Book) {
    this.book = { ...book };
    this.bookId = book.id!;
    this.isEditing = true;
  }

  deleteUserBook(id: string) {
    this.bookService.deleteBook(id).subscribe(() => this.loadUserBooks());
  }

  saveUserBook() {
    this.bookService.updateBook(this.bookId, this.book).subscribe(() => {
      this.isEditing = false;
      this.loadUserBooks();
    });
  }

  getStatusLabel(status: string): string {
    const labels: any = { reading: 'Čitam', planned: 'Planirana', finished: 'Pročitana' };
    return labels[status] || status;
  }

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

  deleteUser(userId: string) {
    const token = this.authService.getToken();
    this.http.delete(`${environment.firebaseDatabaseUrl}/users/${userId}.json?auth=${token}`)
      .subscribe(() => this.loadUsers());
  }

  saveCatalogueBook() {
    if (this.editingCatalogueId) {
      this.catalogueService.updateBook(this.editingCatalogueId, this.catalogueBook).subscribe(() => {
        this.router.navigateByUrl('/tabs/tab1');
      });
    } else {
      this.catalogueService.addBook(this.catalogueBook).subscribe(() => {
        this.router.navigateByUrl('/tabs/tab1');
      });
    }
  }
}