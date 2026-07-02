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
  tempNewPassword = '';
  tempConfirmPassword = '';
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
    this.tempNewPassword = '';
    this.tempConfirmPassword = '';
    this.passwordError = '';
    this.isEditingProfile = true;
  }

  async saveProfile() {
    this.passwordError = '';

    // Ako je unesena lozinka — validiramo je
    if (this.tempNewPassword) {
      if (this.tempNewPassword.length < 6) {
        this.passwordError = 'Lozinka mora imati najmanje 6 karaktera.';
        return;
      }
      if (this.tempNewPassword !== this.tempConfirmPassword) {
        this.passwordError = 'Lozinke se ne poklapaju.';
        return;
      }
    }

    const token = this.authService.getToken();
    const userId = this.authService.getUserId();
    const role = this.isAdmin ? 'admin' : 'user';

    // Sačuvaj profil
    const profile = { email: this.email, role, username: this.tempUsername, avatarUrl: this.tempAvatarUrl };
    this.http.patch(`${environment.firebaseDatabaseUrl}/users/${userId}/profile.json?auth=${token}`, profile)
      .subscribe(async () => {
        this.username = this.tempUsername;
        this.avatarUrl = this.tempAvatarUrl;

        // Ako je unesena nova lozinka — menjamo je
        if (this.tempNewPassword) {
          const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${environment.firebaseApiKey}`;
          
            console.log('TOKEN:', token);
  console.log('API KEY:', environment.firebaseApiKey);
  console.log('LOZINKA:', this.tempNewPassword);
          
          this.http.post(url, {
            idToken: token,
            password: this.tempNewPassword,
            returnSecureToken: true
          }).subscribe({
            next: async () => {
              this.isEditingProfile = false;
              const alert = await this.alertCtrl.create({
                header: 'Uspešno',
                message: 'Profil i lozinka su sačuvani.',
                buttons: ['OK']
              });
              await alert.present();
            },
            error: async () => {
              const alert = await this.alertCtrl.create({
                header: 'Greška',
                message: 'Profil je sačuvan, ali promena lozinke nije uspela.',
                buttons: ['OK']
              });
              await alert.present();
            }
          });
        } else {
          this.isEditingProfile = false;
          const alert = await this.alertCtrl.create({
            header: 'Uspešno',
            message: 'Profil je sačuvan.',
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