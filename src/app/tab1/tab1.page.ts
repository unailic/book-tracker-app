import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSearchbar, IonFab, IonFabButton, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, create, addCircle } from 'ionicons/icons';
import { CatalogueService, CatalogueBook } from '../services/catalogue.service';
import { AuthService } from '../services/auth.service';
import { BookService } from '../services/book.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonSearchbar, IonFab, IonFabButton, IonBadge],
})
export class Tab1Page {
  books: CatalogueBook[] = [];
  filteredBooks: CatalogueBook[] = [];
  searchQuery = '';
  isAdmin = false;

  constructor(
    private catalogueService: CatalogueService,
    private bookService: BookService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ add, trash, create, addCircle });
    this.isAdmin = this.authService.isAdmin();
  }

  ionViewWillEnter() {
    this.loadBooks();
  }

  loadBooks() {
    this.catalogueService.getBooks().subscribe(books => {
      this.books = books;
      this.filteredBooks = books;
    });
  }

  search() {
    if (!this.searchQuery.trim()) {
      this.filteredBooks = this.books;
      return;
    }
    this.filteredBooks = this.books.filter(b =>
      b.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      b.genre.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  addToLibrary(book: CatalogueBook) {
    const userBook = {
      catalogueBookId: book.id!,
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: 'planned' as const,
      rating: undefined,
      notes: '',
      userId: this.authService.getUserId() || ''
    };
    this.bookService.addBook(userBook).subscribe(() => {
      alert(`"${book.title}" dodata u vašu biblioteku!`);
    });
  }

  editBook(book: CatalogueBook) {
    this.router.navigate(['/tabs/tab2'], { state: { book } });
  }

  deleteBook(id: string) {
    this.catalogueService.deleteBook(id).subscribe(() => this.loadBooks());
  }

  initCatalogue() {
    this.catalogueService.initCatalogue().subscribe(() => {
      this.loadBooks();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}