import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { book, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class RegisterPage {
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ book, eyeOutline, eyeOffOutline });
  }

  register() {
    this.authService.register(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/tabs/tab1'),
      error: () => this.errorMessage = 'Registracija neuspešna. Pokušajte ponovo.'
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}