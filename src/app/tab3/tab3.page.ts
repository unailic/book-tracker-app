import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { BookService } from '../services/book.service';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon],
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

  // promena lozinke
  isChangingPassword = false;
  newPassword = '';
  confirmPassword = '';
  passwordError = '';

  // statistike — samo za usera
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

  constructor(
    private authService: AuthService,
    private bookService: BookService,
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ logOutOutline });
    this.isAdmin = this.authService.isAdmin();
  }

  ionViewWillEnter() {
    this.loadProfile();
    if (!this.isAdmin) {
      this.bookService.getBooks().subscribe(books => this.books = books);
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
    this.isChangingPassword = false;
  }

  saveProfile() {
    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    const role = this.isAdmin ? 'admin' : 'user';
    const profile = { email: this.email, role, username: this.tempUsername, avatarUrl: this.tempAvatarUrl };
    this.http.patch(`${environment.firebaseDatabaseUrl}/users/${userId}/profile.json?auth=${token}`, profile)
      .subscribe(() => {
        this.username = this.tempUsername;
        this.avatarUrl = this.tempAvatarUrl;
        this.isEditingProfile = false;
      });
  }

  openChangePassword() {
    this.isChangingPassword = true;
    this.isEditingProfile = false;
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
  }

  async savePassword() {
    // Validacija
    if (this.newPassword.length < 6) {
      this.passwordError = 'Lozinka mora imati najmanje 6 karaktera.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Lozinke se ne poklapaju.';
      return;
    }

    // Firebase endpoint za promenu lozinke
    const token = this.authService.getToken();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebaseApiKey}`;

    this.http.post(url, {
      idToken: token,
      password: this.newPassword,
      returnSecureToken: true
    }).subscribe({
      next: async () => {
        this.isChangingPassword = false;
        const alert = await this.alertCtrl.create({
          header: 'Uspešno',
          message: 'Lozinka je promenjena.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async () => {
        const alert = await this.alertCtrl.create({
          header: 'Greška',
          message: 'Promena lozinke nije uspela. Pokušajte ponovo.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  getInitials(): string {
    if (this.username) return this.username.slice(0, 2).toUpperCase();
    if (this.email) return this.email.slice(0, 2).toUpperCase();
    return '??';
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}