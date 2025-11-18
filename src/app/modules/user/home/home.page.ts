import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { PlanesService } from '../../../services/planes.service';
import { User, Plan } from '../../../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {
  currentUser$: Observable<User | null>;
  planes$: Observable<Plan[]>;
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    autoplay: {
      delay: 5000
    }
  };

  constructor(
    private authService: AuthService,
    private planesService: PlanesService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.planes$ = this.planesService.getPlanes();
  }

  ngOnInit() {}

  goToMisContrataciones() {
    this.router.navigate(['/mis-contrataciones']);
  }

  goToPlanDetail(planId: string) {
    this.router.navigate(['/plan-detail', planId]);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToCatalog() {
    this.router.navigate(['/catalog']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/catalog']);
    });
  }
}
