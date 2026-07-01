import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFab, IonFabButton, IonModal, IonButton, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline, createOutline, addCircleOutline, bookOutline, searchOutline, closeOutline } from 'ionicons/icons';
import { CatalogueService, CatalogueBook } from '../services/catalogue.service';
import { AuthService } from '../services/auth.service';
import { BookService } from '../services/book.service';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonFab, IonFabButton, IonModal, IonButton],
})
export class Tab1Page {
  books: CatalogueBook[] = [];
  filteredBooks: CatalogueBook[] = [];
  searchQuery = '';
  isAdmin = false;
  showModal = false;
  editingBook: CatalogueBook = { title: '', author: '', genre: '', description: '', year: new Date().getFullYear() };
  editingBookId = '';

  constructor(
    private catalogueService: CatalogueService,
    private bookService: BookService,
    private authService: AuthService,
    private alertCtrl: AlertController,
  ) {
    addIcons({ add, trashOutline, createOutline, addCircleOutline, bookOutline, searchOutline, closeOutline });
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

  getGenres(): string[] {
    const genres = [...new Set(this.filteredBooks.map(b => b.genre))];
    return genres.sort((a, b) => {
      if (a === 'Roman') return -1;
      if (b === 'Roman') return 1;
      return a.localeCompare(b);
    });
  }

  getBooksByGenre(genre: string): CatalogueBook[] {
    return this.filteredBooks.filter(b => b.genre === genre);
  }

  getCoverColor(title: string): string {
    return '#C4956A';
  }

  getInitials(title: string): string {
    return title.split(' ').slice(0, 2).map(w => w[0]).join('');
  }

  async showBookDetails(book: CatalogueBook) {
    const alert = await this.alertCtrl.create({
      header: book.title,
      subHeader: `${book.author} · ${book.year}`,
      message: `Žanr: ${book.genre}\n\n${book.description}`,
      cssClass: 'book-alert',
      buttons: ['Zatvori']
    });
    await alert.present();
  }

  openAddModal() {
    this.editingBook = { title: '', author: '', genre: '', description: '', year: new Date().getFullYear() };
    this.editingBookId = '';
    this.showModal = true;
  }

  openEditModal(book: CatalogueBook) {
    this.editingBook = { ...book };
    this.editingBookId = book.id!;
    this.showModal = true;
  }

  saveBook() {
    if (this.editingBookId) {
      this.catalogueService.updateBook(this.editingBookId, this.editingBook).subscribe(() => {
        this.showModal = false;
        this.loadBooks();
      });
    } else {
      this.catalogueService.addBook(this.editingBook).subscribe(() => {
        this.showModal = false;
        this.loadBooks();
      });
    }
  }

  async deleteBook(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Brisanje knjige',
      message: 'Da li ste sigurni da želite da obrišete ovu knjigu iz kataloga?',
      cssClass: 'book-alert',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        { text: 'Obriši', role: 'destructive', cssClass: 'delete-button',
          handler: () => this.catalogueService.deleteBook(id).subscribe(() => this.loadBooks())
        }
      ]
    });
    await alert.present();
  }

  async addToLibrary(book: CatalogueBook) {
    const alreadyAdded = this.bookService.getUserBooks().some(b => b.catalogueBookId === book.id);
    
    if (alreadyAdded) {
      const alert = await this.alertCtrl.create({
        header: 'Već u biblioteci',
        message: `"${book.title}" je već u vašoj biblioteci.`,
        cssClass: 'book-alert',
        buttons: ['U redu']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Dodaj u biblioteku',
      message: `Da li želite da dodate "${book.title}" u vašu biblioteku?`,
      cssClass: 'book-alert',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        { text: 'Dodaj', handler: () => {
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
          this.bookService.addBook(userBook).subscribe();
        }}
      ]
    });
    await alert.present();
  }

  initCatalogue() {
    this.catalogueService.initCatalogue().subscribe(() => {
      this.loadBooks();
    });
  }

  onImgError(event: any, book: CatalogueBook) {
    event.target.style.display = 'none';
    book.coverUrl = undefined;
  }
}

