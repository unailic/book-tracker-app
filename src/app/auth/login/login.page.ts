import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonInput, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { book, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonInput, IonItem, IonLabel, IonIcon],
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ book, eyeOutline, eyeOffOutline });
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/tabs/tab1'),
      error: () => this.errorMessage = 'Pogrešan email ili lozinka.'
    });
  }

  goToRegister() {
    this.router.navigateByUrl('/register');
  }
}