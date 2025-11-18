import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { ContratacionDetalle, User } from '../../../models';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-contratos',
  templateUrl: './contratos.page.html',
  styleUrls: ['./contratos.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class ContratosPage implements OnInit {
  contrataciones$!: Observable<ContratacionDetalle[]>;
  currentUser$: Observable<User | null>;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private contratacionesService: ContratacionesService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.contrataciones$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.contratacionesService.getContratacionesByUsuario(user.id);
        }
        return Promise.resolve([]);
      })
    );
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToChat(contratacionId: string) {
    this.router.navigate(['/chat', contratacionId]);
  }

  getStatusBadge(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'cancelada':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'Activa';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  }
}
