import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlanesService } from '../../../services/planes.service';
import { AuthService } from '../../../services/auth.service';
import { Plan } from '../../../models';
import { Observable } from 'rxjs';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CatalogPage implements OnInit {
  planes$: Observable<Plan[]>;
  isAuthenticated$: Observable<boolean>;
  selectedSegment = 'todos';

  constructor(
    private planesService: PlanesService,
    private authService: AuthService,
    private router: Router
  ) {
    this.planes$ = this.planesService.getPlanes();
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit() {}

  goToDetail(planId: string) {
    this.router.navigate(['/plan-detail', planId]);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  onProfileClick() {
    const isAuth = this.isAuthenticated$ ? true : false;
    if (isAuth) {
      this.goToHome();
    } else {
      this.goToLogin();
    }
  }

  filterBySegment(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getSegmentClass(segmento: string): string {
    switch (segmento) {
      case 'Básico':
        return 'basico';
      case 'Medio':
        return 'medio';
      case 'Premium':
        return 'premium';
      default:
        return '';
    }
  }
}
