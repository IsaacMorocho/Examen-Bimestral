import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { PlanesService } from '../../../services/planes.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { User, Plan, ContratacionDetalle } from '../../../models';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DashboardPage implements OnInit {
  currentUser$: Observable<User | null>;
  planes$: Observable<Plan[]>;
  contratacionesPendientes$: Observable<ContratacionDetalle[]>;
  stats$: Observable<any>;
  fabOpen = false;

  constructor(
    private authService: AuthService,
    private planesService: PlanesService,
    private contratacionesService: ContratacionesService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.planes$ = this.planesService.getPlanes();
    this.contratacionesPendientes$ = this.contratacionesService.getContratacionesPendientes();

    this.stats$ = combineLatest([
      this.planes$,
      this.contratacionesPendientes$
    ]).pipe(
      map(([planes, contratos]) => ({
        totalPlanes: planes.length,
        contratacionesPendientes: contratos.filter(c => c.estado === 'pendiente').length,
        contratacionesActivas: contratos.filter(c => c.estado === 'activa').length
      }))
    );
  }

  ngOnInit() {}

  toggleFAB() {
    this.fabOpen = !this.fabOpen;
  }

  goToCreatePlan() {
    this.router.navigate(['/advisor/plan-form']);
  }

  goToEditPlan(planId: string) {
    this.router.navigate(['/advisor/plan-form', planId]);
  }

  goToPendingContracts() {
    this.router.navigate(['/advisor/pending-contracts']);
  }

  goToChatList() {
    this.router.navigate(['/advisor/chat-list']);
  }

  goToProfile() {
    this.router.navigate(['/advisor/profile']);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/catalog']);
    });
  }
}
