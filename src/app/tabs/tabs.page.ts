import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, libraryOutline, barChartOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
})
export class TabsPage {
  isAdmin = false;

  constructor(private authService: AuthService) {
    addIcons({ bookOutline, libraryOutline, barChartOutline });
    this.isAdmin = this.authService.isAdmin();
  }
}