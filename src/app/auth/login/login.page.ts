import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonInput, IonItem, IonLabel, IonIcon, LoadingController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { book, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

 
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;
 
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({ book, eyeOutline, eyeOffOutline });
  }
 
  async login() {
    // Prikazujemo spinner dok traje HTTP zahtev
    const loading = await this.loadingCtrl.create({
      message: 'Prijava u toku...',
    });
    await loading.present();
 
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        loading.dismiss();
        this.router.navigateByUrl('/tabs/tab1');
      },
      error: async () => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Greška',
          message: 'Pogrešan email ili lozinka.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
 
  goToRegister() {
    this.router.navigateByUrl('/register');
  }
}